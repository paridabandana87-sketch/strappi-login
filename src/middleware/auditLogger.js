module.exports = (config) => {
  return async (ctx, next) => {
    await next();

    // Only log create, update, delete on Content API
    const { method, url, state } = ctx;
    if (!config.enabled) return;
    if (!url.startsWith('/api/')) return;

    const excluded = config.excludeContentTypes || [];
    const contentType = ctx.request.path.split('/')[2];
    if (excluded.includes(contentType)) return;

    let action;
    if (method === 'POST') action = 'create';
    else if (method === 'PUT' || method === 'PATCH') action = 'update';
    else if (method === 'DELETE') action = 'delete';
    else return;

    // Find recordId if applicable
    const recordId = ctx.params.id || (ctx.body && ctx.body.id);
    if (!recordId) return;

    const user = state.user ? state.user.id : null;
    const diff = (action === 'update')
      ? ctx.body // You may want to implement granular diff calculation
      : ctx.request.body;

    await strapi.services['api::audit-log.audit-log'].create({
      data: {
        contentType,
        recordId,
        action,
        timestamp: new Date(),
        user,
        diff
      }
    });
  };
};
