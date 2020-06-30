files=media/*

for f in $files
do
  echo "Processing $f file..."

  fileName=$(echo $f | tail -c +7 | head -c -5)

    # WEBP Conversion in 3 sizes

    mogrify -format webp -path dist/media/ -quality 82 -define webp:lossless=true -define webp:auto-filter=true  $f

    convert $f -resize 300 -quality 82 -define webp:lossless=true -define webp:auto-filter=true "dist/media/$fileName-300.webp"

    convert $f -resize 600 -quality 82 -define webp:lossless=true -define webp:auto-filter=true "dist/media/$fileName-600.webp"

    convert $f -resize 900 -quality 82 -define webp:lossless=true -define webp:auto-filter=true "dist/media/$fileName-900.webp"

    convert $f -resize 1200 -quality 82 -define webp:lossless=true -define webp:auto-filter=true "dist/media/$fileName-1200.webp"


    
    # JPEG Conversion in 3 sizes

    mogrify -format jpg -path dist/media/ -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off  $f

    convert $f -resize 1200 -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off "dist/media/$fileName-1200.jpg"

    convert $f -resize 900 -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off "dist/media/$fileName-900.jpg"

    convert $f -resize 600 -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off "dist/media/$fileName-600.jpg"

    convert $f -resize 300 -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off "dist/media/$fileName-300.jpg"

done