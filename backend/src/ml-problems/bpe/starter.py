class SimpleBPE:
    def __init__(self):
        self.merges = []

    def train(self, corpus, num_merges):
        pass  # iteratively find & merge most frequent pairs

    def encode(self, text):
        pass  # apply learned merges to split text