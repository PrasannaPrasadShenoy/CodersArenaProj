class Int8Linear(nn.Module):
    def __init__(self, weight, bias=None):
        super().__init__()
        pass  # quantize weight, register buffers

    def forward(self, x):
        pass  # dequantize and matmul