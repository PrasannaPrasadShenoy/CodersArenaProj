class MultiHeadCrossAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        pass  # W_q, W_k, W_v, W_o

    def forward(self, x_q, x_kv):
        pass  # Q from x_q, K/V from x_kv, no causal mask