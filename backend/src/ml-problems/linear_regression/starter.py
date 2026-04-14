class LinearRegression:
    def closed_form(self, X: torch.Tensor, y: torch.Tensor):
        """Normal equation: w = (X^T X)^{-1} X^T y"""
        pass  # Return (w, b)

    def gradient_descent(self, X: torch.Tensor, y: torch.Tensor,
                         lr: float = 0.01, steps: int = 1000):
        """Manual gradient descent loop"""
        pass  # Return (w, b)

    def nn_linear(self, X: torch.Tensor, y: torch.Tensor,
                  lr: float = 0.01, steps: int = 1000):
        """Train nn.Linear with autograd"""
        pass  # Return (w, b)