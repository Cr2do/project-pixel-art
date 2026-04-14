import { Types } from 'mongoose';
import { PixelBoard, IPixelBoard } from '../models/pixelboard';
import { Pixel } from '../models/pixel';
import { NotFoundError } from '../utils/errors';
import { CreatePixelBoardInput, UpdatePixelBoardInput } from '../utils/schemas';

const CANVAS_MAX_WIDTH = Number(process.env.CANVAS_MAX_WIDTH ?? 5000);

async function computeNextPosition(
  width: number,
  height: number,
): Promise<{ position_x: number; position_y: number }> {
  const boards = await PixelBoard.find().select('position_x position_y width height').lean();
  if (boards.length === 0) return { position_x: 0, position_y: 0 };

  for (let y = 0; ; y++) {
    let x = 0;
    while (x + width <= CANVAS_MAX_WIDTH) {
      const collider = boards.find(
        (b) =>
          !(
            x + width <= b.position_x ||
            x >= b.position_x + b.width ||
            y + height <= b.position_y ||
            y >= b.position_y + b.height
          ),
      );
      if (!collider) return { position_x: x, position_y: y };
      x = collider.position_x + collider.width; // saut intelligent au bord droit du collider
    }
  }
}

export async function createPixelBoard(input: CreatePixelBoardInput & { authorUserId: string }): Promise<IPixelBoard> {
  const { position_x, position_y } = await computeNextPosition(input.width, input.height);
  return PixelBoard.create({
    ...input,
    position_x,
    position_y,
    contributions: [{
      userId: new Types.ObjectId(input.authorUserId),
      nb_pixels_placed: 0,
      is_author: true,
    }],
  });
}

export async function findAll(): Promise<IPixelBoard[]> {
  return PixelBoard.find();
}

export async function findById(id: string): Promise<IPixelBoard | null> {
  return PixelBoard.findById(id);
}

export async function updatePixelBoard(id: string, input: UpdatePixelBoardInput): Promise<IPixelBoard> {
  // Ne pas écraser des champs avec `undefined` lors des updates partielles.
  const setPayload = Object.fromEntries(
    Object.entries(input).filter(([, v]) => v !== undefined),
  );

  const board = await PixelBoard.findByIdAndUpdate(
    id,
    { $set: setPayload },
    { new: true, runValidators: true },
  );
  if (!board) throw new NotFoundError('PixelBoard introuvable');
  return board;
}

export async function deletePixelBoard(id: string): Promise<void> {
  const result = await PixelBoard.findByIdAndDelete(id);
  if (!result) throw new NotFoundError('PixelBoard introuvable');

  // Nettoyage: supprimer les pixels associés pour éviter les documents orphelins.
  await Pixel.deleteMany({ pixelBoardId: result._id });
}
