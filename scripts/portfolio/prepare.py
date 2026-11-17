"""Create import variants; used by import.mjs. Pillow is required only for CLI import."""
import json, sys
from pathlib import Path
from PIL import Image, ImageOps
source, destination = Path(sys.argv[1]), Path(sys.argv[2])
destination.mkdir(parents=True, exist_ok=True)
rows=[]
for file in sorted(source.glob('*.webp')):
    original=source/'originals'/(file.stem+'.png')
    if not original.exists(): original=file
    if original.stat().st_size>20*1024*1024: raise ValueError(f'{original.name} exceeds 20 MB')
    target=destination/file.stem
    target.mkdir(exist_ok=True)
    with Image.open(file) as image:
        image.load()
        if image.width*image.height>48000000: raise ValueError(f'{file.name} exceeds 48 megapixels')
        image.thumbnail((1920,16383),Image.Resampling.LANCZOS)
        image.save(target/'full.webp','WEBP',quality=82,method=6)
        for name,size in [('thumb',(960,640)),('small',(480,320))]:
            ImageOps.fit(image,size,method=Image.Resampling.LANCZOS,centering=(.5,0)).save(target/(name+'.webp'),'WEBP',quality=82,method=6)
        rows.append(dict(name=file.stem,width=image.width,height=image.height,original=str(original.resolve()),directory=str(target.resolve()),source_bytes=file.stat().st_size,original_bytes=original.stat().st_size,full_bytes=(target/'full.webp').stat().st_size,thumb_bytes=(target/'thumb.webp').stat().st_size,small_bytes=(target/'small.webp').stat().st_size))
print(json.dumps(rows))
