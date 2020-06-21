files=media/*

for f in $files
do
  echo "Processing $f file..."

  fileName=$(echo $f | tail -c +7 | head -c -5)

    # WEBP Conversion in 3 sizes

    mogrify -format webp -path dist/media/ -quality 82 -define webp:lossless=true -define webp:auto-filter=true  $f

    convert $f -resize 800 -quality 82 -define webp:lossless=true -define webp:auto-filter=true "dist/media/$fileName-800.webp"

    convert $f -resize 400 -quality 82 -define webp:lossless=true -define webp:auto-filter=true "dist/media/$fileName-400.webp"

    
    # JPEG Conversion in 3 sizes

    mogrify -format jpg -path dist/media/ -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off  $f

    convert $f -resize 800 -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off "dist/media/$fileName-800.jpg"

    convert $f -resize 400 -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off "dist/media/$fileName-400.jpg"

done