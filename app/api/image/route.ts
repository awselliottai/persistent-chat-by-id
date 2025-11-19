// /api/image/route.ts

import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export const runtime = 'nodejs'; // needed because we use fs / Buffer

export async function POST(req: Request) {
  try {
    console.log('Received image edit request');
    const formData = await req.formData();

    const prompt = (formData.get('prompt') as string) || '';
    const file = formData.get('image') as File | null;

    if (!file || !prompt) {
      console.log('Image file and prompt are required');
      return NextResponse.json(
        { error: 'Image file and prompt are required' },
        { status: 400 },
      );
    }

    console.log('Reading uploaded file');
    // Read the uploaded file and convert to base64
    const fileArrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(fileArrayBuffer);
    const base64Data = fileBuffer.toString('base64');
    const mimeType = file.type || 'image/png';

    console.log('Initializing Gemini client');
    // Initialize Gemini client
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    // Use the image-capable model
    const modelName = 'gemini-2.5-flash';

    console.log('Generating content with Gemini');
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          inlineData: {
            mimeType,
            data: base64Data,
          },
        },
        { text: prompt },
      ],
    });

    console.log('Gemini response:', response);

    // candidates[0]?.content?.parts is where the parts live in this typing
    const candidate = response.candidates?.[0];
    const parts = candidate?.content?.parts ?? [];

    console.log('Parts:', parts);

    for (const part of parts) {
      if (part.inlineData) {
        const outputBase64 = part.inlineData.data;

        if (outputBase64) {
          console.log('Saving output image to disk');
          const outputBuffer = Buffer.from(outputBase64, 'base64');
          const outputFilename = `edited_${uuidv4()}.png`;
          const outputFilePath = path.join(
            process.cwd(),
            'public',
            'edited_images',
            outputFilename,
          );

          // Ensure directory exists
          await fs.mkdir(path.dirname(outputFilePath), { recursive: true });
          await fs.writeFile(outputFilePath, outputBuffer);

          return NextResponse.json({
            message: 'Image edited successfully',
            imageUrl: `/edited_images/${outputFilename}`,
          });
        }
      }

      if (part.text) {
        // Optional: handle text-only responses from the model
        console.log('Model returned text-only response');
        return NextResponse.json({ message: part.text });
      }
    }

    console.log('No image or text returned by model');
    return NextResponse.json(
      { message: 'No image or text returned by model' },
      { status: 500 },
    );
  } catch (error: any) {
    console.error('Error editing image:', error);

    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 },
    );
  }
}
