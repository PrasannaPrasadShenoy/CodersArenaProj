def ppo_loss(new_logps: Tensor, old_logps: Tensor, advantages: Tensor,
             clip_ratio: float = 0.2) -> Tensor:
    pass  # -mean(min(r * adv, clamp(r, 1-clip, 1+clip) * adv)) with gradients only through new_logps
