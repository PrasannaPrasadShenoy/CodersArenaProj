export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const messages = result.error.errors.map((e) => e.message);
      return res.status(400).json({ error: messages.join("; ") });
    }
    req.validated = result.data;
    next();
  };
}
