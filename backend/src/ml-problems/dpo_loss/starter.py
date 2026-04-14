def dpo_loss(policy_chosen_logps, policy_rejected_logps,
             ref_chosen_logps, ref_rejected_logps, beta=0.1):
    pass  # -log(sigmoid(beta * (chosen_reward - rejected_reward)))