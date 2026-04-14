from torch import Tensor

def grpo_loss(logps: Tensor, rewards: Tensor, group_ids: Tensor,
              eps: float = 1e-5) -> Tensor:
    pass  # compute normalized advantages per group and return -mean(adv.detach() * logps)