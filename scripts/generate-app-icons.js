const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src', 'assets', 'images', 'offerbid-logo.png');
const ASSETS = path.join(ROOT, 'assets');
const STORE = path.join(ASSETS, 'store');
const IMAGES = path.join(ASSETS, 'images');

const BLUE = {r: 39, g: 105, b: 225, alpha: 1};

function gradientSvg(width, height) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#2769E1"/>
      <stop offset="100%" stop-color="#11928E"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`);
}

function featureGraphicSvg(width, height) {
  return Buffer.from(`<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#2769E1"/>
      <stop offset="100%" stop-color="#11928E"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <text x="560" y="250" font-family="Arial, Helvetica, sans-serif" font-size="92" font-weight="800" fill="#FFFFFF">OfferBid</text>
  <text x="560" y="310" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="rgba(255,255,255,0.85)">Buy &amp; sell locally. Bid, agree, meet.</text>
</svg>`);
}

function punchCornerWhite(data, width, height) {
  const isBg = i =>
    data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245 && data[i + 3] > 8;
  const idx = (x, y) => (y * width + x) * 4;
  const seen = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (seen[p]) return;
    const i = idx(x, y);
    if (!isBg(i)) return;
    seen[p] = 1;
    stack.push(x, y);
  };

  for (let x = 0; x < width; x += 1) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    push(0, y);
    push(width - 1, y);
  }

  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    const i = idx(x, y);
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
    push(x - 1, y);
    push(x + 1, y);
    push(x, y - 1);
    push(x, y + 1);
  }
}

function toWhiteSilhouette(data) {
  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    if (a < 10) {
      data[i] = 0;
      data[i + 1] = 0;
      data[i + 2] = 0;
      data[i + 3] = 0;
      continue;
    }
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    if (lum > 155) {
      data[i] = 255;
      data[i + 1] = 255;
      data[i + 2] = 255;
      data[i + 3] = 255;
    } else {
      data[i + 3] = 0;
    }
  }
}

async function rawToPng(data, width, height) {
  return sharp(Buffer.from(data), {raw: {width, height, channels: 4}})
    .png()
    .toBuffer();
}

async function save(filePath, image) {
  await fs.promises.mkdir(path.dirname(filePath), {recursive: true});
  const buffer = Buffer.isBuffer(image) ? image : await image.png().toBuffer();
  await fs.promises.writeFile(filePath, buffer);
  const meta = await sharp(filePath).metadata();
  console.log(`wrote ${path.relative(ROOT, filePath)} (${meta.width}x${meta.height})`);
}

async function squareOnGradient(mark, size, padRatio = 0) {
  const inner = Math.round(size * (1 - padRatio * 2));
  const resized = await sharp(mark)
    .resize(inner, inner, {
      fit: 'contain',
      background: {r: 0, g: 0, b: 0, alpha: 0},
    })
    .png()
    .toBuffer();

  return sharp(gradientSvg(size, size))
    .composite([{input: resized, gravity: 'centre'}])
    .flatten({background: BLUE})
    .png()
    .toBuffer();
}

async function main() {
  await fs.promises.mkdir(ASSETS, {recursive: true});
  await fs.promises.mkdir(STORE, {recursive: true});
  await fs.promises.mkdir(IMAGES, {recursive: true});

  const {data, info} = await sharp(SRC)
    .ensureAlpha()
    .raw()
    .toBuffer({resolveWithObject: true});

  punchCornerWhite(data, info.width, info.height);
  const mark = await rawToPng(data, info.width, info.height);

  await fs.promises.writeFile(path.join(IMAGES, 'offerbid-logo.png'), mark);
  await fs.promises.writeFile(
    path.join(ROOT, 'src', 'assets', 'images', 'offerbid-logo-mark.png'),
    mark,
  );
  console.log('wrote transparent-corner logo mark');

  const silhouette = Buffer.from(data);
  toWhiteSilhouette(silhouette);
  const silhouettePng = await rawToPng(silhouette, info.width, info.height);

  await save(path.join(ASSETS, 'icon.png'), await squareOnGradient(mark, 1024, 0.04));
  await save(
    path.join(ASSETS, 'adaptive-icon.png'),
    await squareOnGradient(mark, 1024, 0.18),
  );
  await save(
    path.join(ASSETS, 'splash-icon.png'),
    sharp(mark).resize(1024, 1024, {
      fit: 'contain',
      background: {r: 0, g: 0, b: 0, alpha: 0},
    }),
  );
  await save(path.join(ASSETS, 'favicon.png'), await squareOnGradient(mark, 48, 0.04));
  await save(
    path.join(ASSETS, 'notification-icon.png'),
    sharp(silhouettePng).resize(96, 96, {
      fit: 'contain',
      background: {r: 0, g: 0, b: 0, alpha: 0},
    }),
  );

  await save(
    path.join(STORE, 'appstore-icon-1024.png'),
    await squareOnGradient(mark, 1024, 0.04),
  );
  await save(
    path.join(STORE, 'playstore-icon-512.png'),
    await squareOnGradient(mark, 512, 0.04),
  );
  await fs.promises.copyFile(
    path.join(STORE, 'playstore-icon-512.png'),
    path.join(STORE, 'icon-512.png'),
  );
  console.log('wrote assets/store/icon-512.png (512x512)');

  const bannerLogo = await sharp(mark)
    .resize(360, 360, {
      fit: 'contain',
      background: {r: 0, g: 0, b: 0, alpha: 0},
    })
    .png()
    .toBuffer();

  await save(
    path.join(STORE, 'playstore-feature-graphic-1024x500.png'),
    sharp(featureGraphicSvg(1024, 500)).composite([
      {input: bannerLogo, left: 80, top: 70},
    ]),
  );

  await save(
    path.join(ASSETS, 'android-icon-monochrome.png'),
    sharp(silhouettePng).resize(1024, 1024, {
      fit: 'contain',
      background: {r: 0, g: 0, b: 0, alpha: 0},
    }),
  );
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
