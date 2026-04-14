# ML Problems (TorchCode-style)

This directory stores ML track problems for `GET /api/problems?track=ml`.

## Current track scope

The ML track list is intentionally limited to the TorchCode Fundamentals set:

- `relu`
- `softmax`
- `cross_entropy`
- `dropout`
- `embedding`
- `gelu`
- `weight_init`
- `gradient_clipping`
- `gradient_accumulation`
- `linear_regression`
- `linear`
- `layernorm`
- `batchnorm`
- `rmsnorm`
- `mlp`
- `conv2d`

## Required files per problem folder

- `problem.json`
- `starter.py`
- `tests_public.json`
- `tests_hidden.json`

## Test format used by the ML judge

The judge supports TorchCode-style snippet tests:

```json
{
  "tests": [
    {
      "name": "Basic values",
      "code": "x = torch.tensor([-1., 1.])\nout = {fn}(x)\nexpected = torch.tensor([0., 1.])\nassert torch.allclose(out, expected)"
    }
  ]
}
```

Notes:

- `{fn}` is replaced with `functionName` from `problem.json`.
- A test passes when the snippet executes without raising an exception.
- For public tests, the judge attempts to expose `out`/`actual` and `expected` values in the result payload.
- Hidden tests mask values and failures with `Hidden test failed`.

The judge also retains compatibility with the older expression format (`call`/`expected`) if present.
