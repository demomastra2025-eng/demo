import { doctorAgent } from './agents/doctor-agent';

async function main() {
  const stream = await doctorAgent.stream([
    {
      role: 'user',
      content: 'Provide a short summary of treatment for migraine with citations.'
    }
  ]);

  const response = stream.aisdk.v5;
  const uiStream = response.toUIMessageStreamResponse();

  const reader = uiStream.body?.getReader();
  if (!reader) {
    console.error('No reader');
    return;
  }

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    console.log(Buffer.from(value).toString());
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
