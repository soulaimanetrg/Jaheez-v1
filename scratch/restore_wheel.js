const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logsDir = 'C:/Users/user/.gemini/antigravity-ide/brain/22528553-e72a-4f4b-9aba-6f579f6f796e/.system_generated/logs';
const transcriptPath = path.join(logsDir, 'transcript_full.jsonl');
const outputPath = 'd:/soulaimane/jaheeez/Jaheez-v1/frontend/user-app/app/(tabs)/index.tsx';

async function restore() {
  const fileStream = fs.createReadStream(transcriptPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let chunk1 = '';
  let chunk2 = '';
  let chunk3 = '';

  for await (const line of rl) {
    const obj = JSON.parse(line);
    if (obj.step_index === 5601) {
      chunk1 = obj.content;
    } else if (obj.step_index === 5603) {
      chunk2 = obj.content;
    } else if (obj.step_index === 5605) {
      chunk3 = obj.content;
    }
  }

  if (!chunk1 || !chunk2 || !chunk3) {
    console.error('Failed to find all chunks in transcript!');
    return;
  }

  // Combine and clean up line numbers prefix (e.g., "1: import...", "15: ...")
  function cleanChunk(chunk) {
    // Split by newlines, extract the portion after "<line_number>: "
    const lines = chunk.split('\n');
    const cleaned = [];
    for (const l of lines) {
      if (l.startsWith('Created At:') || l.startsWith('Completed At:') || l.startsWith('File Path:') || l.startsWith('Total Lines:') || l.startsWith('Total Bytes:') || l.startsWith('Showing lines') || l.startsWith('The following code')) {
        continue;
      }
      const match = l.match(/^\d+:\s?(.*)$/);
      if (match) {
        cleaned.push(match[1]);
      } else {
        cleaned.push(l);
      }
    }
    return cleaned.join('\n');
  }

  const code1 = cleanChunk(chunk1);
  const code2 = cleanChunk(chunk2);
  const code3 = cleanChunk(chunk3);

  const fullCode = (code1 + '\n' + code2 + '\n' + code3).trim();
  fs.writeFileSync(outputPath, fullCode, 'utf8');
  console.log('Successfully restored original circular wheel design to index.tsx!');
}

restore().catch(console.error);
