#!/bin/bash
# This script uses imagemagick to convert images in a 
# folder (and it's subfolders) into smaller sized variants.

# This script was writting by Clemens Scott and tested under Ubuntu 20 LTS
# It us used in production with https://nchrs.xyz

# Use with care and backup your images!
# The repository for this script can be found at
# https://git.sr.ht/~rostiger/batchResize/
# -----------------------------------------------------------------------------
# path where the original images are located
SRC="data/media"
# path where the images will be stored
DST="www/media"
# sizes to convert to
SIZES=( 240 680 900 )
MAXWIDTH=1200

function resize () {
  
  # Ugh, I forgot what this does exactly.. :S
  [[ $file == *"data/media/*"* ]] && exit
  
  # Just a security check to prevent an endless loop in case
  # $DST is inside $SRC (don't do that!) 
  [[ $file == *"${DST}/*"* ]] && continue 
      
  # convert jpg/jpeg/png
  for file in $1/*.jpg $1/*jpeg $1/*png
  do
    # skip file if it doesn't exist
  	[ -f "$file" ] || continue
    
    # create output path
    path=$(dirname $file)   # just/the/path    
    name=$(basename $file)  # filename.ext
    fileBase="${name%%.*}"  # filename
    fileExt="${name#*.}"    # ext

    # substitute source path with destination path
    # ${firstString/pattern/secondString}
    dst="${path/$SRC/$DST}"    

    # existing images are skipped (delete images if they were updated)    
    # create the output path (and parents) if it doesn't exist
    if [[ ! -d "$dst" ]]; then 
      mkdir -p $dst
    fi

    # create smaller sizes for responsive image selection
  	for size in "${SIZES[@]}"
  	do
      # define output path and file
      output="$dst/$fileBase-${size}.$fileExt"
      outputwebp="$dst/$fileBase-${size}.webp"
      if [[ ! -f $output ]]; then
      
        # resize only  if original image is greater than or equal to (ge) the current size
        width=$(identify -format "%w" "$file")> /dev/null

        # if [[ $width -ge $size ]]; then
          echo $file
          echo -n "| ${size} "

          convert $file -resize $size -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off $output
              
          convert $file -resize $size -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define webp:lossless=true -define webp:auto-filter=true $outputwebp

        # else echo -n "| ----- "
  		  # fi
      fi
    done
    # Finally also strip the original image of it's EXIF data
    # and resize it to a max width of 1200
    output="$dst/$name"
    outputwebp="$dst/$fileBase.webp"
    if [[ ! -f $output ]]; then

      convert $file -resize $MAXWIDTH -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define jpeg:fancy-upsampling=off $output

      convert $file -resize $MAXWIDTH -filter Triangle -define filter:support=2 -unsharp 0.25x0.08+8.3+0.045 -posterize 136 -quality 82 -define webp:lossless=true -define webp:auto-filter=true $outputwebp
      
      echo -n "| ${MAXWIDTH} "
    fi
  done
}

# find all file in the source folder and run resize() on each
find $SRC | while read file; do resize "${file}"; done