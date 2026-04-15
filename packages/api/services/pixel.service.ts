import { Types } from 'mongoose';
import { PNG } from 'pngjs';
import { Pixel, IPixel } from '../models/pixel';
import { PixelEvent } from '../models/pixelEvent';
import { PixelBoard } from '../models/pixelboard';
import { NotFoundError, ForbiddenError, ConflictError, BadRequestError } from '../utils/errors';
import { PlacePixelInput } from '../utils/schemas';

async function incrementContribution(pixelBoardId: Types.ObjectId, userId: Types.ObjectId, amount: number): Promise<void> {
  const hasContribution = await PixelBoard.exists({
    _id: pixelBoardId,
    'contributions.userId': userId,
  });

  if (hasContribution) {
    await PixelBoard.updateOne(
      { _id: pixelBoardId, 'contributions.userId': userId },
      { $inc: { 'contributions.$.nb_pixels_placed': amount } },
    );
    return;
  }

  await PixelBoard.updateOne(
    { _id: pixelBoardId },
    { $push: { contributions: { userId, nb_pixels_placed: amount, is_author: false } } },
  );
}

export async function placePixel(input: PlacePixelInput & { pixelBoardId: string; userId: string }): Promise<IPixel> {
  const boardId = new Types.ObjectId(input.pixelBoardId);
  const userId = new Types.ObjectId(input.userId);

  const board = await PixelBoard.findById(boardId);
  if (!board) throw new NotFoundError('PixelBoard introuvable');

  if (board.endAt && board.endAt.getTime() <= Date.now()) {
    if (board.status !== 'FINISHED') {
      board.status = 'FINISHED';
      await board.save();
    }
    throw new ForbiddenError('Ce PixelBoard a atteint sa date de fin, aucune contribution possible');
  }

  if (board.status === 'FINISHED') {
    throw new ForbiddenError('Ce PixelBoard est terminé, aucun pixel ne peut être placé');
  }

  if (input.position_x >= board.width || input.position_y >= board.height) {
    throw new BadRequestError(
      `Position hors limites — le board fait ${board.width}×${board.height} pixels`,
    );
  }

  const lastPixel = await Pixel.findOne({ pixelBoardId: boardId, userId }).sort({ updatedAt: -1 });

  if (lastPixel && board.delay_seconds > 0) {
    const elapsed = (Date.now() - lastPixel.updatedAt.getTime()) / 1000;
    if (elapsed < board.delay_seconds) {
      const remaining = Math.ceil(board.delay_seconds - elapsed);
      throw new ForbiddenError(`Cooldown actif, attendez encore ${remaining} seconde(s)`);
    }
  }

  let pixel: IPixel;

  // Always store an immutable placement event so we can build "most-used" heatmaps.
  // This is independent from the board override policy.
  await PixelEvent.create({
    pixelBoardId: boardId,
    userId,
    position_x: input.position_x,
    position_y: input.position_y,
    color: input.color,
  });

  if (board.allow_override) {
    const updated = await Pixel.findOneAndUpdate(
      { pixelBoardId: boardId, position_x: input.position_x, position_y: input.position_y },
      { userId, color: input.color },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    pixel = updated as unknown as IPixel;
  } else {
    const existing = await Pixel.findOne({
      pixelBoardId: boardId,
      position_x: input.position_x,
      position_y: input.position_y,
    });
    if (existing) throw new ConflictError('Un pixel existe déjà à cette position');

    pixel = await Pixel.create({
      pixelBoardId: boardId,
      userId,
      position_x: input.position_x,
      position_y: input.position_y,
      color: input.color,
    });
  }

  await incrementContribution(boardId, userId, 1);

  return pixel;
}

export async function findByBoard(pixelBoardId: string): Promise<(Omit<IPixel, 'userId'> & { username: string })[]> {
  const pixels = await Pixel.find({ pixelBoardId: new Types.ObjectId(pixelBoardId) })
    .populate<{ userId: { firstname: string; lastname: string } | null }>('userId', 'firstname lastname');

  return pixels.map((p) => {
    const json = p.toJSON() as Record<string, unknown>;
    const user = p.userId as { firstname: string; lastname: string } | null;
    return {
      ...json,
      username: user ? `${user.firstname} ${user.lastname}` : 'Inconnu',
    } as Omit<IPixel, 'userId'> & { username: string };
  });
}

export async function findByUser(userId: string): Promise<IPixel[]> {
  return Pixel.find({ userId: new Types.ObjectId(userId) });
}

export async function getReplayByBoard(pixelBoardId: string, limit: number, offset: number): Promise<{
  boardId: string;
  totalEvents: number;
  events: Array<{
    pixelId: string;
    userId: string;
    position_x: number;
    position_y: number;
    color: string;
    createdAt: Date;
  }>;
}> {
  const board = await PixelBoard.findById(pixelBoardId).lean();
  if (!board) throw new NotFoundError('PixelBoard introuvable');

  const [events, totalEvents] = await Promise.all([
    Pixel.find({ pixelBoardId: new Types.ObjectId(pixelBoardId) })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Pixel.countDocuments({ pixelBoardId: new Types.ObjectId(pixelBoardId) }),
  ]);

  return {
    boardId: pixelBoardId,
    totalEvents,
    events: events.map((event) => ({
      pixelId: event._id.toString(),
      userId: event.userId.toString(),
      position_x: event.position_x,
      position_y: event.position_y,
      color: event.color,
      createdAt: event.createdAt,
    })),
  };
}

export async function uploadImageContribution(input: {
  pixelBoardId: string;
  userId: string;
  imageBuffer: Buffer;
  offset_x: number;
  offset_y: number;
  maxPixels: number;
}): Promise<{
  processedPixels: number;
  appliedPixels: number;
  skippedPixels: number;
}> {
  const boardId = new Types.ObjectId(input.pixelBoardId);
  const userId = new Types.ObjectId(input.userId);
  const board = await PixelBoard.findById(boardId);
  if (!board) throw new NotFoundError('PixelBoard introuvable');

  if (board.endAt && board.endAt.getTime() <= Date.now()) {
    if (board.status !== 'FINISHED') {
      board.status = 'FINISHED';
      await board.save();
    }
    throw new ForbiddenError('Ce PixelBoard a atteint sa date de fin, aucune contribution possible');
  }

  if (board.status === 'FINISHED') {
    throw new ForbiddenError('Ce PixelBoard est terminé, aucune contribution possible');
  }

  let parsed: PNG;
  try {
    parsed = PNG.sync.read(input.imageBuffer);
  } catch {
    throw new BadRequestError('Image PNG invalide');
  }

  const candidates: Array<{ position_x: number; position_y: number; color: string }> = [];
  let done = false;

  for (let y = 0; y < parsed.height && !done; y++) {
    for (let x = 0; x < parsed.width && !done; x++) {
      if (candidates.length >= input.maxPixels) {
        done = true;
        break;
      }

      const idx = (parsed.width * y + x) << 2;
      const r = parsed.data[idx] ?? 0;
      const g = parsed.data[idx + 1] ?? 0;
      const b = parsed.data[idx + 2] ?? 0;
      const a = parsed.data[idx + 3] ?? 255;

      // Ignore fully transparent pixels, but blend semi-transparent ones
      if (a < 25) continue;

      const boardX = input.offset_x + x;
      const boardY = input.offset_y + y;

      if (boardX < 0 || boardY < 0 || boardX >= board.width || boardY >= board.height) continue;

      const color = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
      candidates.push({ position_x: boardX, position_y: boardY, color });
    }
  }

  if (candidates.length === 0) {
    return { processedPixels: 0, appliedPixels: 0, skippedPixels: 0 };
  }

  let appliedPixels = 0;

  if (board.allow_override) {
    const operations = candidates.map((candidate) => ({
      updateOne: {
        filter: {
          pixelBoardId: boardId,
          position_x: candidate.position_x,
          position_y: candidate.position_y,
        },
        update: {
          $set: {
            userId,
            color: candidate.color,
          },
          $setOnInsert: {
            pixelBoardId: boardId,
            position_x: candidate.position_x,
            position_y: candidate.position_y,
          },
        },
        upsert: true,
      },
    }));

    if (operations.length > 0) {
      await Pixel.bulkWrite(operations, { ordered: false });
      appliedPixels = operations.length;
    }
  } else {
    const existing = await Pixel.find({ pixelBoardId: boardId }).select('position_x position_y').lean();
    const existingSet = new Set(existing.map((p) => `${p.position_x}:${p.position_y}`));

    const toInsert = candidates
      .filter((candidate) => !existingSet.has(`${candidate.position_x}:${candidate.position_y}`))
      .map((candidate) => ({
        pixelBoardId: boardId,
        userId,
        position_x: candidate.position_x,
        position_y: candidate.position_y,
        color: candidate.color,
      }));

    if (toInsert.length > 0) {
      await Pixel.insertMany(toInsert, { ordered: false });
      appliedPixels = toInsert.length;
    }
  }

  if (appliedPixels > 0) {
    await incrementContribution(boardId, userId, appliedPixels);
  }

  return {
    processedPixels: candidates.length,
    appliedPixels,
    skippedPixels: candidates.length - appliedPixels,
  };
}
