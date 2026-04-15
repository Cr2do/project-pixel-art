import { PNG } from 'pngjs';
import { PixelBoard } from '../models/pixelboard';
import { Pixel } from '../models/pixel';
import { NotFoundError } from '../utils/errors';

function hexToRgb(hex: string): [number, number, number] {
	const clean = hex.replace('#', '');
	const r = Number.parseInt(clean.slice(0, 2), 16);
	const g = Number.parseInt(clean.slice(2, 4), 16);
	const b = Number.parseInt(clean.slice(4, 6), 16);
	return [r, g, b];
}

export async function getBoardForExport(pixelBoardId: string) {
	const board = await PixelBoard.findById(pixelBoardId).lean();
	if (!board) throw new NotFoundError('PixelBoard introuvable');

	const pixels = await Pixel.find({ pixelBoardId: board._id }).lean();
	return { board, pixels };
}

export async function buildBoardSvg(pixelBoardId: string): Promise<string> {
	const { board, pixels } = await getBoardForExport(pixelBoardId);

	const rects = pixels
		.map((pixel) => `<rect x="${pixel.position_x}" y="${pixel.position_y}" width="1" height="1" fill="${pixel.color}" />`)
		.join('');

	return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${board.width} ${board.height}" width="${board.width}" height="${board.height}" shape-rendering="crispEdges"><rect x="0" y="0" width="${board.width}" height="${board.height}" fill="#ffffff"/>${rects}</svg>`;
}

export async function buildBoardPng(pixelBoardId: string): Promise<Buffer> {
	const { board, pixels } = await getBoardForExport(pixelBoardId);

	const png = new PNG({ width: board.width, height: board.height });

	for (let i = 0; i < png.data.length; i += 4) {
		png.data[i] = 255;
		png.data[i + 1] = 255;
		png.data[i + 2] = 255;
		png.data[i + 3] = 255;
	}

	for (const pixel of pixels) {
		if (
			pixel.position_x < 0 ||
			pixel.position_y < 0 ||
			pixel.position_x >= board.width ||
			pixel.position_y >= board.height
		) {
			continue;
		}

		const [r, g, b] = hexToRgb(pixel.color);
		const idx = (board.width * pixel.position_y + pixel.position_x) << 2;
		png.data[idx] = r;
		png.data[idx + 1] = g;
		png.data[idx + 2] = b;
		png.data[idx + 3] = 255;
	}

	return PNG.sync.write(png);
}
