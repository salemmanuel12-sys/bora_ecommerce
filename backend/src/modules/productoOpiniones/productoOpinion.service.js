const { Op } = require('sequelize');
const {
  sequelize,
  Producto,
  ProductoOpinion,
  Usuario,
  Order,
  OrderItem,
} = require('../../models');
const HttpError = require('../../utils/httpError');

function toPublicOpinion(opinion) {
  const item = opinion?.get ? opinion.get({ plain: true }) : opinion;

  return {
    id: item.id,
    productoId: item.productoId,
    userId: item.userId,
    rating: item.rating,
    title: item.title,
    comment: item.comment,
    status: item.status,
    verifiedPurchase: Boolean(item.verifiedPurchase),
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    usuario: item.usuario
      ? {
          id: item.usuario.id,
          nombre: item.usuario.nombre,
        }
      : undefined,
  };
}

async function assertProductoExists(productoId) {
  const producto = await Producto.findByPk(productoId);

  if (!producto) {
    throw new HttpError(404, 'Producto no encontrado.');
  }

  return producto;
}

async function recalculateProductoRating(productoId, transaction) {
  const aggregate = await ProductoOpinion.findOne({
    attributes: [
      [sequelize.fn('AVG', sequelize.col('rating')), 'averageRating'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'totalRatings'],
    ],
    where: {
      productoId,
      status: 'Aprobada',
    },
    raw: true,
    transaction,
  });

  const averageRating = aggregate?.averageRating ? Number(aggregate.averageRating) : 0;
  const totalRatings = aggregate?.totalRatings ? Number(aggregate.totalRatings) : 0;

  await Producto.update(
    {
      averageRating: Math.round(averageRating * 100) / 100,
      totalRatings,
    },
    {
      where: { id: productoId },
      transaction,
    }
  );
}

async function hasVerifiedPurchase(userId, productoId) {
  const item = await OrderItem.findOne({
    where: { productId: productoId },
    include: [
      {
        model: Order,
        as: 'order',
        required: true,
        where: {
          userId,
          status: {
            [Op.in]: ['Pagado', 'Enviado', 'Entregado'],
          },
        },
      },
    ],
  });

  return Boolean(item);
}

async function listPublicOpinionesByProducto(productoId, { page = 1, limit = 10 } = {}) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  await assertProductoExists(parsedProductoId);

  const { count, rows } = await ProductoOpinion.findAndCountAll({
    where: {
      productoId: parsedProductoId,
      status: 'Aprobada',
    },
    include: [
      {
        model: Usuario,
        as: 'usuario',
        attributes: ['id', 'nombre'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  const producto = await Producto.findByPk(parsedProductoId, {
    attributes: ['id', 'averageRating', 'totalRatings'],
  });

  const groupedRatings = await ProductoOpinion.findAll({
    attributes: [
      'rating',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
    ],
    where: {
      productoId: parsedProductoId,
      status: 'Aprobada',
    },
    group: ['rating'],
    raw: true,
  });

  const distributionMap = groupedRatings.reduce((accumulator, item) => {
    accumulator[Number(item.rating)] = Number(item.count || 0);
    return accumulator;
  }, {});

  const distribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: Number(distributionMap[stars] || 0),
  }));

  return {
    opiniones: rows.map(toPublicOpinion),
    resumen: {
      averageRating: Number(producto?.averageRating || 0),
      totalRatings: Number(producto?.totalRatings || 0),
      distribution,
    },
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function listMisOpiniones(userId, { page = 1, limit = 10 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(50, Math.max(1, Number.parseInt(String(limit), 10) || 10));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await ProductoOpinion.findAndCountAll({
    where: { userId },
    include: [
      {
        model: Producto,
        as: 'producto',
        attributes: ['id', 'uuid', 'name'],
      },
    ],
    order: [['createdAt', 'DESC']],
    limit: parsedLimit,
    offset,
  });

  return {
    opiniones: rows.map((row) => {
      const item = toPublicOpinion(row);
      const raw = row.get({ plain: true });
      return {
        ...item,
        producto: raw.producto
          ? {
              id: raw.producto.id,
              uuid: raw.producto.uuid,
              name: raw.producto.name,
            }
          : undefined,
      };
    }),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function upsertMiOpinion({ userId, productoId, rating, title, comment }) {
  const parsedProductoId = Number.parseInt(String(productoId), 10);

  await assertProductoExists(parsedProductoId);

  return sequelize.transaction(async (transaction) => {
    const verifiedPurchase = await hasVerifiedPurchase(userId, parsedProductoId);

    let opinion = await ProductoOpinion.findOne({
      where: { userId, productoId: parsedProductoId },
      transaction,
    });

    if (!opinion) {
      opinion = await ProductoOpinion.create(
        {
          userId,
          productoId: parsedProductoId,
          rating,
          title,
          comment,
          status: 'Pendiente',
          verifiedPurchase,
        },
        { transaction }
      );
    } else {
      await opinion.update(
        {
          rating,
          title,
          comment,
          status: 'Pendiente',
          verifiedPurchase,
        },
        { transaction }
      );
    }

    await recalculateProductoRating(parsedProductoId, transaction);

    return toPublicOpinion(opinion);
  });
}

async function updateMiOpinion({ userId, opinionId, rating, title, comment }) {
  const parsedOpinionId = Number.parseInt(String(opinionId), 10);

  const opinion = await ProductoOpinion.findOne({
    where: {
      id: parsedOpinionId,
      userId,
    },
  });

  if (!opinion) {
    throw new HttpError(404, 'Opinion no encontrada.');
  }

  return sequelize.transaction(async (transaction) => {
    const verifiedPurchase = await hasVerifiedPurchase(userId, opinion.productoId);

    await opinion.update(
      {
        rating,
        title,
        comment,
        status: 'Pendiente',
        verifiedPurchase,
      },
      { transaction }
    );

    await recalculateProductoRating(opinion.productoId, transaction);
    return toPublicOpinion(opinion);
  });
}

async function deleteMiOpinion({ userId, opinionId }) {
  const parsedOpinionId = Number.parseInt(String(opinionId), 10);

  const opinion = await ProductoOpinion.findOne({
    where: {
      id: parsedOpinionId,
      userId,
    },
  });

  if (!opinion) {
    throw new HttpError(404, 'Opinion no encontrada.');
  }

  return sequelize.transaction(async (transaction) => {
    const productoId = opinion.productoId;
    await opinion.destroy({ transaction });
    await recalculateProductoRating(productoId, transaction);
    return { message: 'Opinion eliminada correctamente.' };
  });
}

async function adminListPendientes({ page = 1, limit = 20 } = {}) {
  const parsedPage = Math.max(1, Number.parseInt(String(page), 10) || 1);
  const parsedLimit = Math.min(100, Math.max(1, Number.parseInt(String(limit), 10) || 20));
  const offset = (parsedPage - 1) * parsedLimit;

  const { count, rows } = await ProductoOpinion.findAndCountAll({
    where: { status: 'Pendiente' },
    include: [
      { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'email'] },
      { model: Producto, as: 'producto', attributes: ['id', 'uuid', 'name'] },
    ],
    order: [['createdAt', 'ASC']],
    limit: parsedLimit,
    offset,
  });

  return {
    opiniones: rows.map((row) => {
      const raw = row.get({ plain: true });
      return {
        ...toPublicOpinion(raw),
        producto: raw.producto
          ? {
              id: raw.producto.id,
              uuid: raw.producto.uuid,
              name: raw.producto.name,
            }
          : undefined,
        usuario: raw.usuario
          ? {
              id: raw.usuario.id,
              nombre: raw.usuario.nombre,
              email: raw.usuario.email,
            }
          : undefined,
      };
    }),
    pagination: {
      total: count,
      page: parsedPage,
      limit: parsedLimit,
      pages: Math.max(1, Math.ceil(count / parsedLimit)),
    },
  };
}

async function adminUpdateStatus({ opinionId, status }) {
  const parsedOpinionId = Number.parseInt(String(opinionId), 10);

  const opinion = await ProductoOpinion.findByPk(parsedOpinionId);

  if (!opinion) {
    throw new HttpError(404, 'Opinion no encontrada.');
  }

  return sequelize.transaction(async (transaction) => {
    await opinion.update({ status }, { transaction });
    await recalculateProductoRating(opinion.productoId, transaction);
    return toPublicOpinion(opinion);
  });
}

module.exports = {
  listPublicOpinionesByProducto,
  listMisOpiniones,
  upsertMiOpinion,
  updateMiOpinion,
  deleteMiOpinion,
  adminListPendientes,
  adminUpdateStatus,
};
