class MyAdam:
    def __init__(self, params, lr=1e-3, betas=(0.9, 0.999), eps=1e-8):
        pass  # store params, init m and v to zeros

    def step(self):
        pass  # update params using Adam rule

    def zero_grad(self):
        pass  # zero all gradients