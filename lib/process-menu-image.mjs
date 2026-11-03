import sharp from 'sharp';

export async function processMenuImage(buffer, kind) {
  const sizes={dish:1600,category:256,offer:1920};
  const targets={dish:200000,category:60000,offer:350000};
  if (!sizes[kind] || !Buffer.isBuffer(buffer) || !buffer.length || buffer.length > 2000000) throw new Error('INVALID_IMAGE');
  const png=buffer.length>=8 && buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg=buffer.length>=3 && buffer[0]===255 && buffer[1]===216 && buffer[2]===255;
  const webp=buffer.length>=12 && buffer.toString('ascii',0,4)==='RIFF' && buffer.toString('ascii',8,12)==='WEBP';
  if(!png && !jpeg && !webp) throw new Error('INVALID_IMAGE');
  const pipeline=sharp(buffer,{limitInputPixels:40000000,failOn:'warning'});
  const metadata=await pipeline.metadata();
  if (!['jpeg','png','webp'].includes(metadata.format) || (metadata.pages || 1) > 1 || !metadata.width || !metadata.height) throw new Error('INVALID_IMAGE');
  let output;
  for (const quality of [82,72,62]) {
    output=await pipeline.clone().rotate().resize({width:sizes[kind],height:sizes[kind],fit:'inside',withoutEnlargement:true}).webp({quality,effort:4}).toBuffer();
    if(output.length <= targets[kind]) break;
  }
  if(output.length > 500000) throw new Error('IMAGE_TOO_LARGE');
  return output;
}
