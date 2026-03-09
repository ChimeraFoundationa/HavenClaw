/**
 * Test Google Gemini API directly
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = 'AIzaSyBEQBnWOiZmfkt88wzD1RTACE44lqO0n-s';

async function testGemini() {
  console.log('Testing Google Gemini API...\n');
  
  const genAI = new GoogleGenerativeAI(API_KEY);
  
  try {
    // List available models
    console.log('Listing available models...');
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${API_KEY}`
    );
    const data = await response.json();
    console.log('Available models:');
    if (data.models) {
      data.models.forEach((m: any) => {
        console.log('  -', m.name, '| displayName:', m.displayName);
      });
    } else {
      console.log('Error or no models:', JSON.stringify(data, null, 2));
    }
    
    // Try with a simple model
    console.log('\n\nTrying gemini-pro model...');
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent('Say hello in one sentence');
    console.log('Response:', result.response.text());
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testGemini().catch(console.error);
