class LoRALinear(nn.Module):
    def __init__(self, in_features, out_features, rank, alpha=1.0):
        super().__init__()
        pass  # frozen linear + lora_A + lora_B

    def forward(self, x):
        pass  # base + lora