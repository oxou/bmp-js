//
// Copyright (C) 2022-2023 Nurudin Imsirovic <github.com/oxou>
//
// Bitmap Image Encoder/Decoder - Plot
// https://www.github.com/oxou/bmp-js
//
// This file is a part of bmp.js but its contents are contained separately.
//
// It defines plot functions for doing various operations to draw shapes
// on the bitmap.
//
// Created: 2022-09-19 09:32 PM
// Updated: 2022-12-29 03:30 PM
//

/**
 * Plot a rectangle
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @return         true
 */
function bmp_plot_rect(
    resource,
    x = 0,
    y = 0,
    w = 10,
    h = 10,
    r = 255,
    g = 255,
    b = 255
) {
    for (let y2 = y; y2 < h + y; y2++)
        for (let x2 = x; x2 < w + x; x2++)
            if (resource.width  > x2 &&
                resource.height > y2)
                bmp_resource_set_pixel(resource, x2, y2, r, g, b);

    return true;
}

/**
 * Clear everything from the bitmap (by default using Black color)
 *
 * @param resource BMPJS resource
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @return         true
 */
function bmp_plot_clear(
    resource,
    r = 0,
    g = 0,
    b = 0
) {
    for (let y = 0; y < resource.height; y++)
        for (let x = 0; x < resource.width; x++)
            bmp_resource_set_pixel(resource, x, y, r, g, b);

    return true;
}

/**
 * Plot a line from point A to B
 *
 * @param resource BMPJS resource
 * @param x1       Position X #1
 * @param y1       Position Y #1
 * @param x2       Position X #2
 * @param y2       Position Y #2
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_line(
    resource,
    x1,
    y1,
    x2,
    y2,
    r = 255,
    g = 255,
    b = 255,
    p = 1
) {
    p = clamp(p, 0.1, 2); // NOTE(OXOU): Should we even be clamping this value?
    var x = x2 - x1;
    var y = y2 - y1;
    var l = Math.sqrt(x * x + y * y) * p;

    var ax = x / l;
    var ay = y / l;

    x = x1;
    y = y1;

    for (let i = 0; i < l; i++) {
        if (resource.width > x &&
            resource.height > y)
            bmp_resource_set_pixel(resource, x, y, r, g, b);

        x += ax;
        y += ay;
    }

    return true;
}

/**
 * Copy the contents from a resource child to the resource parent
 *
 * @param resource_p BMPJS resource (parent)
 * @param resource_c BMPJS resource (child)
 * @param x          Position X
 * @param y          Position Y
 * @param w          Width  (by default -1, child's width)
 * @param h          Height (by default -1, child's height)
 * @return           true
 */
function bmp_plot_resource(
    resource_p,
    resource_c,
    x = 0,
    y = 0,
    w = -1,
    h = -1
) {
    var resource_c = structuredClone(resource_c);

    w = clamp(w, -1, resource_c.width);
    h = clamp(h, -1, resource_c.height);

    // If width or height are negative 1, we assign each the child's dimensions
    if (w == -1)
        w = resource_c.width;

    if (h == -1)
        h = resource_c.height;

    for (let x1 = 0; x1 < w; x1++) {
        for (let y1 = 0; y1 < h; y1++) {
            if (resource_p.width > x1 + x && resource_p.height > y1 + y) {
                var c = bmp_resource_get_pixel(resource_c, x1, y1);
                bmp_resource_set_pixel(
                    resource_p,
                    x1 + x,
                    y1 + y,
                    c[0],
                    c[1],
                    c[2]
                );
            }
        }
    }

    return true;
}

/**
 * Use a loaded image resource that contains a character set range from
 * 0x20 to 0x80 to plot text
 *
 * @param resource_p BMPJS resource (parent)
 * @param resource_c BMPJS resource (child)
 * @param x          Position X
 * @param y          Position Y
 * @param text       Input String
 * @param wrap       Does text wrap around (default true)
 * @param fr         Color channel Red   (foreground)
 * @param fg         Color channel Green (foreground)
 * @param fb         Color channel Blue  (foreground)
 * @param br         Color channel Red   (background)
 * @param bg         Color channel Green (background)
 * @param bb         Color channel Blue  (background)
 * @return           true
 */
function bmp_plot_text(
    resource_p,
    resource_c,
    x,
    y,
    text = 'A',
    wrap = true,
    fr = 255,
    fg = 255,
    fb = 255,
    br = -1,
    bg = -1,
    bb = -1
) {
    // Offset we add to each x,y position in the for loop
    var x_offset_start = x;
    var y_offset_start = y; // not used
    var x_offset = x;
    var y_offset = y;

    // These are used in lx,ly as initial values, and will be incremented
    // accordingly either by the width or height of the font based on their
    // position relative to the parent dimensions.
    var x_start = 0;
    var y_start = 0;

    // Font width is calculated by diving the font width by the number of
    // total character range from 0x20 to 0x80 which is 96
    var font_width  = resource_c.width / 96;
    var font_height = resource_c.height;
    var font_chars  = resource_c.width / font_width;

    var text_length = text.length;

    for (let text_index = 0; text_index < text_length; text_index++) {
        var char_code = text.charCodeAt(text_index);
        var char_x_offset = (char_code - 32) * font_width;

        // Handle new lines
        if (char_code == 10 || char_code == 13) {
            x_offset  = x_offset_start;
            y_offset += font_height;
            continue;
        }

        // Out of range characters default to font character set
        // width - font_width
        if (0x20 > char_code || char_code > 0x7E)
            char_x_offset = font_width * (font_chars - 1);

        // Word wrap
        if (wrap && x_offset + font_width > resource_p.width) {
            x_offset  = x_offset_start;
            y_offset += font_height;
        }

        for (let ly = y_start; ly < font_height; ly++) {
            for (let lx = x_start; lx < font_width; lx++) {
                // Get the font pixel color based on char_x_offset
                var pixel_c = bmp_resource_get_pixel(
                    resource_c,
                    lx + char_x_offset,
                    ly
                );

                // Foreground
                if (pixel_c[0] == 255 &&
                    pixel_c[1] == 255 &&
                    pixel_c[2] == 255) {
                    if (fr != -1 &&
                        fg != -1 &&
                        fb != -1) {
                        pixel_c[0] = fr;
                        pixel_c[1] = fg;
                        pixel_c[2] = fb;
                    } else {
                        continue;
                    }
                } else
                // Background
                if (pixel_c[0] == 0 &&
                    pixel_c[1] == 0 &&
                    pixel_c[2] == 0) {
                    if (br != -1 &&
                        bg != -1 &&
                        bg != -1) {
                        pixel_c[0] = br;
                        pixel_c[1] = bg;
                        pixel_c[2] = bb;
                    } else {
                        continue;
                    }
                }

                // Write the font pixel to the parent
                if (resource_p.width  > x_offset + lx &&
                    resource_p.height > y_offset + ly)
                    bmp_resource_set_pixel(
                        resource_p,
                        x_offset + lx,
                        y_offset + ly,
                        pixel_c[0],
                        pixel_c[1],
                        pixel_c[2]
                    );
            }
        }

        x_offset += font_width;
    }

    return true;
}

/**
 * Plot a circle
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_circle(
    resource,
    x,
    y,
    w,
    h,
    r,
    g,
    b,
    p = 1
) {
    var points = [
        [247,1],
        [312,8],
        [360,23],
        [403,47],
        [439,78],
        [469,114],
        [490,153],
        [507,205],
        [511,257],
        [505,312],
        [490,360],
        [466,403],
        [435,439],
        [399,469],
        [360,490],
        [308,507],
        [256,511],
        [201,505],
        [153,490],
        [110,466],
        [74,435],
        [44,399],
        [23,360],
        [6,308],
        [2,256],
        [8,201],
        [23,153],
        [47,110],
        [78,74],
        [114,44],
        [153,23],
        [205,6],
        [247,1]
    ];

    for (let i = 1; i < 33; i++) {
        var last = points[i - 1];
        var curr = points[i];
        var lx = last[0] / 512 * w + x;
        var ly = last[1] / 512 * h + y;
        var cx = curr[0] / 512 * w + x;
        var cy = curr[1] / 512 * h + y;
        bmp_plot_line(resource, lx, ly, cx, cy, r, g, b, p);
    }

    return true;
}

/**
 * Plot an arrow pointing up
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_arrow_up(
    resource,
    x,
    y,
    w,
    h,
    r,
    g,
    b,
    p = 1
) {
    var points = [
        [256,1],
        [512,256],
        [384,256],
        [384,512],
        [128,512],
        [128,256],
        [1,256],
        [256,1]
    ];

    for (let i = 1; i < 8; i++) {
        var last = points[i - 1];
        var curr = points[i];
        var lx = last[0] / 512 * w + x;
        var ly = last[1] / 512 * h + y;
        var cx = curr[0] / 512 * w + x;
        var cy = curr[1] / 512 * h + y;
        bmp_plot_line(resource, lx, ly, cx, cy, r, g, b, p);
    }

    return true;
}

/**
 * Plot an arrow pointing down
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_arrow_down(
    resource,
    x,
    y,
    w,
    h,
    r,
    g,
    b,
    p = 1
) {
    var points = [
        [128,0],
        [384,0],
        [384,256],
        [512,256],
        [256,512],
        [0,256],
        [128,256],
        [128,0]
    ];

    for (let i = 1; i < 8; i++) {
        var last = points[i - 1];
        var curr = points[i];
        var lx = last[0] / 512 * w + x;
        var ly = last[1] / 512 * h + y;
        var cx = curr[0] / 512 * w + x;
        var cy = curr[1] / 512 * h + y;
        bmp_plot_line(resource, lx, ly, cx, cy, r, g, b, p);
    }

    return true;
}

/**
 * Plot an arrow pointing left
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_arrow_left(
    resource,
    x,
    y,
    w,
    h,
    r,
    g,
    b,
    p = 1
) {
    var points = [
        [0,256],
        [256,0],
        [256,128],
        [512,128],
        [512,384],
        [256,384],
        [256,512],
        [0,256]
    ];

    for (let i = 1; i < 8; i++) {
        var last = points[i - 1];
        var curr = points[i];
        var lx = last[0] / 512 * w + x;
        var ly = last[1] / 512 * h + y;
        var cx = curr[0] / 512 * w + x;
        var cy = curr[1] / 512 * h + y;
        bmp_plot_line(resource, lx, ly, cx, cy, r, g, b, p);
    }

    return true;
}

/**
 * Plot an arrow pointing right
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_arrow_right(
    resource,
    x,
    y,
    w,
    h,
    r,
    g,
    b,
    p = 1
) {
    var points = [
        [0,128],
        [256,128],
        [256,0],
        [512,256],
        [256,512],
        [256,384],
        [0,384],
        [0,128]
    ];

    for (let i = 1; i < 8; i++) {
        var last = points[i - 1];
        var curr = points[i];
        var lx = last[0] / 512 * w + x;
        var ly = last[1] / 512 * h + y;
        var cx = curr[0] / 512 * w + x;
        var cy = curr[1] / 512 * h + y;
        bmp_plot_line(resource, lx, ly, cx, cy, r, g, b, p);
    }

    return true;
}

/**
 * Plot a triangle
 *
 * @param resource BMPJS resource
 * @param x        Position X
 * @param y        Position Y
 * @param w        Width
 * @param h        Height
 * @param r        Color channel Red
 * @param g        Color channel Green
 * @param b        Color channel Blue
 * @param p        Precision of line (clamped from 0.1 to 2)
 * @return         true
 */
function bmp_plot_triangle(
    resource,
    x,
    y,
    w,
    h,
    r,
    g,
    b,
    p = 1
) {
    var points = [
        [256,0],
        [512,512],
        [0,512],
        [256,0]
    ];

    for (let i = 1; i < 4; i++) {
        var last = points[i - 1];
        var curr = points[i];
        var lx = last[0] / 512 * w + x;
        var ly = last[1] / 512 * h + y;
        var cx = curr[0] / 512 * w + x;
        var cy = curr[1] / 512 * h + y;
        bmp_plot_line(resource, lx, ly, cx, cy, r, g, b, p);
    }

    return true;
}
