class KVCacheAttention(nn.Module):
    def __init__(self, d_model, num_heads):
        super().__init__()
        pass  # Initialize W_q, W_k, W_v, W_o

    def forward(self, x, cache=None):
        # 1. Project Q, K, V from x
        # 2. Reshape to multi-head: (B, num_heads, S, d_k)
        # 3. If cache exists, concat new K/V with cached K/V
        # 4. Compute attention (causal mask needed during prefill)
        # 5. Return (output, (K_all, V_all))
        pass