function setupPermisosAssociations(models) {
  const {
    Rol,
    Modulo,
    Submodulo,
    Accion,
    RolModulo,
    RolSubmodulo,
    RolAccion,
  } = models;

  Modulo.hasMany(Submodulo, {
    foreignKey: 'MODULO_ID',
    sourceKey: 'ID_MODULO',
    as: 'submodulos',
  });

  Submodulo.belongsTo(Modulo, {
    foreignKey: 'MODULO_ID',
    targetKey: 'ID_MODULO',
    as: 'modulo',
  });

  Submodulo.hasMany(Accion, {
    foreignKey: 'SUBMODULO_ID',
    sourceKey: 'ID_SUBMODULO',
    as: 'acciones',
  });

  Accion.belongsTo(Submodulo, {
    foreignKey: 'SUBMODULO_ID',
    targetKey: 'ID_SUBMODULO',
    as: 'submodulo',
  });

  Rol.belongsToMany(Modulo, {
    through: RolModulo,
    foreignKey: 'ROL_ID',
    otherKey: 'MODULO_ID',
    as: 'modulos',
  });

  Modulo.belongsToMany(Rol, {
    through: RolModulo,
    foreignKey: 'MODULO_ID',
    otherKey: 'ROL_ID',
    as: 'roles',
  });

  Rol.belongsToMany(Submodulo, {
    through: RolSubmodulo,
    foreignKey: 'ROL_ID',
    otherKey: 'SUBMODULO_ID',
    as: 'submodulos',
  });

  Submodulo.belongsToMany(Rol, {
    through: RolSubmodulo,
    foreignKey: 'SUBMODULO_ID',
    otherKey: 'ROL_ID',
    as: 'roles',
  });

  Rol.belongsToMany(Accion, {
    through: RolAccion,
    foreignKey: 'ROL_ID',
    otherKey: 'ACCION_ID',
    as: 'acciones',
  });

  Accion.belongsToMany(Rol, {
    through: RolAccion,
    foreignKey: 'ACCION_ID',
    otherKey: 'ROL_ID',
    as: 'roles',
  });
}

module.exports = setupPermisosAssociations;
