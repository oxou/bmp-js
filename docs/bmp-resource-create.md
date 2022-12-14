# bmp-js / Documentation / bmp_resource_create

## Introduction

### Description

Create a BMP resource

### Parameters

1. `width` | `Width (X axis) of the image (non-zero)`
2. `height` | `Height (Y axis) of the image (non-zero)`

Returns: BMPJS Resource `(object)`

## Code examples

```js
// Create a 128 x 64 image
var bmp_resource = bmp_resource_create(128, 64);

// Spawn the image into the container
bmp_resource_spawn(bmp_resource, bmp_container);
```

## Expected Result

![expected-result](./img/003.png)
