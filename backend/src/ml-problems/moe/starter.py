class MixtureOfExperts(nn.Module):
    def __init__(self, d_model, d_ff, num_experts, top_k=2):
        super().__init__()
        pass  # router + experts

    def forward(self, x):
        pass  # route tokens to top-k experts