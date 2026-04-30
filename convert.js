const ffmpeg = require('ffmpeg-static');
const { execSync } = require('child_process');
console.log('FFmpeg path:', ffmpeg);
const input = '/Users/sivakkannanr/.gemini/antigravity/brain/a54f40ce-fe5d-433b-bd27-3eb38faa86da/demo_recording_1777513161266.webp';
const output = 'demo.gif';
// Create high quality GIF using palettegen
execSync(`"${ffmpeg}" -y -i "${input}" -vf "fps=10,scale=800:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${output}"`, { stdio: 'inherit' });
