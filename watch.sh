while sleep 0.1; do ls data/*/*.* | entr -d ./build.sh; done