#!/bin/bash
# Generate PNG icons from SVG

cd /root/soft/integration-clawdbot/extension/icons

# Check if rsvg-convert is available
if command -v rsvg-convert &> /dev/null; then
    rsvg-convert -w 16 -h 16 -o icon16.png icon.svg
    rsvg-convert -w 48 -h 48 -o icon48.png icon.svg
    rsvg-convert -w 128 -h 128 -o icon128.png icon.svg
    echo "✅ Icons generated successfully!"
else
    echo "⚠️ rsvg-convert not found. Creating placeholder icons..."
    
    # Create simple placeholder PNGs using ImageMagick if available
    if command -v convert &> /dev/null; then
        convert -size 16x16 xc:#6366f1 icon16.png
        convert -size 48x48 xc:#8b5cf6 icon48.png
        convert -size 128x128 xc:#6366f1 icon128.png
        echo "✅ Placeholder icons created with ImageMagick!"
    else
        echo "❌ Please install librsvg or imagemagick to generate icons"
        echo "   Ubuntu: sudo apt-get install librsvg2-bin imagemagick"
        echo "   macOS: brew install librsvg imagemagick"
        exit 1
    fi
fi
