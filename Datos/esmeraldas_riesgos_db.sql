-- ======================================================================================
-- PROYECTO: Sistema Integral de Gestión de Riesgos y Emergencias (Esmeraldas)
-- MOTOR DE BASE DE DATOS: PostgreSQL 14+ con extensión espacial PostGIS
-- COMPATIBLE CON: Aiven Cloud PostgreSQL, Docker y entornos productivos
-- CODIFICACIÓN: UTF-8 | SISTEMA DE REFERENCIA ESPACIAL: EPSG:4326 (WGS 84)
-- ======================================================================================

-- En caso de que haya quedado una transacción fallida abierta en pgAdmin, ejecutar:
ROLLBACK;

BEGIN;

-- --------------------------------------------------------------------------------------
-- 0. EXTENSIONES REQUERIDAS
-- --------------------------------------------------------------------------------------
-- PostGIS: Manejo nativo de tipos geométricos (Point, LineString, Polygon) y funciones ST_*
CREATE EXTENSION IF NOT EXISTS postgis;

-- NOTA IMPORTANTE PARA POSTGRESQL 13+:
-- En PostgreSQL 13, 14, 15 y 16 (como se observa en tu pgAdmin), la función gen_random_uuid() 
-- es 100% NATIVA en el núcleo de PostgreSQL.
-- Por lo tanto, NO se requiere "uuid-ossp" (la cual suele ser bloqueada por políticas DLL de Windows).

-- --------------------------------------------------------------------------------------
-- 1. TIPOS ENUMERADOS (DOMINIOS CONTROLADOS)
-- --------------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE rol_usuario_enum AS ENUM (
        'CIUDADANO',
        'OPERADOR_COE',
        'ANALISTA',
        'ASISTENCIA',
        'ADMINISTRADOR'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE nivel_riesgo_enum AS ENUM ('ALTO', 'MEDIO', 'BAJO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE gravedad_incidente_enum AS ENUM ('CRITICO', 'ALTO', 'MEDIO', 'BAJO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_incidente_enum AS ENUM ('PENDIENTE', 'EN_PROCESO', 'ATENDIDO', 'DESCARTADO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE estado_via_enum AS ENUM ('TRANSITABLE', 'BLOQUEADO_INUNDACION', 'BLOQUEADO_DERRUMBE', 'EN_MANTENIMIENTO');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE tipo_suministro_enum AS ENUM ('ALIMENTO', 'AGUA', 'MEDICINA', 'KIT_ASEO', 'COLCHON_COBIJA', 'HERRAMIENTAS');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE nivel_alerta_enum AS ENUM ('ROJA', 'NARANJA', 'AMARILLA', 'INFORMATIVA');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- --------------------------------------------------------------------------------------
-- 2. TABLA DE USUARIOS Y PERSONAS (AUTENTICACIÓN Y REGISTRO MÓVIL)
-- Compatible con AbstractUser de Django y con el registro en 2 pasos de la App Móvil
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMPTZ,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE,
    first_name VARCHAR(150) NOT NULL,
    last_name VARCHAR(150) NOT NULL,
    is_staff BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    -- Identificación y Contacto (Específico para App Móvil)
    email VARCHAR(254) UNIQUE,
    telefono VARCHAR(15) UNIQUE NOT NULL,
    telefono_emergencia VARCHAR(15),
    cedula VARCHAR(10) UNIQUE,
    rol rol_usuario_enum NOT NULL DEFAULT 'CIUDADANO',
    esta_verificado BOOLEAN NOT NULL DEFAULT FALSE,

    -- Localización y Residencia en Esmeraldas
    canton VARCHAR(50) NOT NULL DEFAULT 'Esmeraldas',
    parroquia VARCHAR(80),
    barrio_sector VARCHAR(120),
    direccion_domicilio TEXT,
    ubicacion_domicilio GEOMETRY(Point, 4326),

    -- Vulnerabilidad Familiar (Módulos 2 y 5)
    tiene_personas_vulnerables BOOLEAN NOT NULL DEFAULT FALSE,
    numero_personas_hogar SMALLINT NOT NULL DEFAULT 1 CHECK (numero_personas_hogar >= 1),

    -- Protección de Datos Personales (LOPDP Ecuador)
    acepta_terminos_privacidad BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE usuarios IS 'Padrón unificado de usuarios: ciudadanos registrados vía móvil, operadores COE y administradores.';
COMMENT ON COLUMN usuarios.ubicacion_domicilio IS 'Coordenada GPS de residencia para cruce predictivo con polígonos de riesgo.';

-- --------------------------------------------------------------------------------------
-- 3. MÓDULO 1: GIS Y MAPA INTELIGENTE DE RIESGOS
-- Capas de polígonos de zonas inundables, red hídrica, vial y servicios esenciales
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS zonas_riesgo (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo_evento VARCHAR(80) NOT NULL DEFAULT 'INUNDACION', -- Inundación, Deslizamiento, Tsunami
    nivel_riesgo nivel_riesgo_enum NOT NULL DEFAULT 'ALTO',
    descripcion TEXT,
    geometria GEOMETRY(Polygon, 4326) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_levantamiento DATE DEFAULT CURRENT_DATE,
    fuente_informacion VARCHAR(150) DEFAULT 'SNGRE / Municipio de Esmeraldas'
);

COMMENT ON TABLE zonas_riesgo IS 'Polígonos de susceptibilidad a riesgos (Módulo 1: Semáforo visual Alto, Medio, Bajo).';

CREATE TABLE IF NOT EXISTS capas_hidricas_viales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- 'RIO', 'ESTERO', 'PUENTE', 'CARRETERA_PRINCIPAL'
    geometria GEOMETRY(LineString, 4326) NOT NULL,
    caudal_referencia NUMERIC(8,2), -- en m3/s (opcional para hidrología)
    observaciones TEXT
);

COMMENT ON TABLE capas_hidricas_viales IS 'Trazados de ríos (Teaone, Esmeraldas) y red vial estructural.';

CREATE TABLE IF NOT EXISTS infraestructuras_esenciales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(180) NOT NULL,
    tipo VARCHAR(60) NOT NULL, -- 'HOSPITAL', 'SUBESTACION_ELECTRICA', 'BOMBEROS', 'POLICIA', 'UNIDAD_EDUCATIVA'
    direccion TEXT,
    telefono_contacto VARCHAR(30),
    contacto_responsable VARCHAR(120),
    capacidad_atencion INT,
    ubicacion GEOMETRY(Point, 4326) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE infraestructuras_esenciales IS 'Centros de salud, bomberos y policía de soporte para evacuación.';

-- --------------------------------------------------------------------------------------
-- 4. MÓDULO 2: SISTEMA DE REPORTE CIUDADANO DE EMERGENCIAS (APP MÓVIL Y WEB)
-- Diseñado con soporte nativo de UUID para modo offline y sincronización diferida
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS reportes_incidentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    
    -- Localización y Datos del Incidente
    tipo_evento VARCHAR(80) NOT NULL, -- 'INUNDACION', 'DESLIZAMIENTO', 'COLAPSO_ESTRUCTURAL', 'OTRO'
    nivel_gravedad gravedad_incidente_enum NOT NULL DEFAULT 'MEDIO',
    descripcion TEXT NOT NULL,
    ubicacion GEOMETRY(Point, 4326) NOT NULL,
    precision_gps_metros NUMERIC(6,2),
    
    -- Estimación de personas y daños (RF-02.4 y RF-02.5)
    personas_atrapadas INT NOT NULL DEFAULT 0 CHECK (personas_atrapadas >= 0),
    familias_afectadas INT NOT NULL DEFAULT 0 CHECK (familias_afectadas >= 0),
    estimacion_danos_vivienda TEXT,

    -- Control Operativo y Diferenciación de Datos (RF-6)
    estado estado_incidente_enum NOT NULL DEFAULT 'PENDIENTE',
    es_simulacion BOOLEAN NOT NULL DEFAULT FALSE,
    sincronizado_offline BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Tiempos
    fecha_incidente TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_recepcion_servidor TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE reportes_incidentes IS 'Reportes emitidos por la ciudadanía desde la app móvil o web.';

CREATE TABLE IF NOT EXISTS fotos_incidentes (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reportes_incidentes(id) ON DELETE CASCADE,
    url_archivo TEXT NOT NULL,
    tamano_bytes INT,
    formato_mime VARCHAR(50),
    fecha_subida TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE fotos_incidentes IS 'Evidencias fotográficas adjuntas al reporte ciudadano (RF-02.3).';

CREATE TABLE IF NOT EXISTS auditoria_seguimiento_reportes (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reportes_incidentes(id) ON DELETE CASCADE,
    operador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    estado_anterior estado_incidente_enum,
    estado_nuevo estado_incidente_enum NOT NULL,
    observaciones TEXT,
    fecha_cambio TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE auditoria_seguimiento_reportes IS 'Historial de cambios de estado del incidente atendido por el COE.';

-- --------------------------------------------------------------------------------------
-- 5. MÓDULO 3: CENTRO DE OPERACIONES Y GESTIÓN DE ALERTAS (COMANDO COE)
-- Gestión de alertas tempranas geocercadas, asignación de recursos y WebSockets
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas_tempranas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    emisor_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    titulo VARCHAR(200) NOT NULL,
    mensaje TEXT NOT NULL,
    nivel_alerta nivel_alerta_enum NOT NULL DEFAULT 'AMARILLA',
    sector_afectado VARCHAR(150) NOT NULL,
    poligono_afectacion GEOMETRY(Polygon, 4326), -- Geocerca para disparo a móviles
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    es_simulacro BOOLEAN NOT NULL DEFAULT FALSE,
    fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ
);

COMMENT ON TABLE alertas_tempranas IS 'Alertas tempranas emitidas oficialmente por el COE para la población.';

CREATE TABLE IF NOT EXISTS recursos_operativos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(120) NOT NULL,
    tipo VARCHAR(60) NOT NULL, -- 'AMBULANCIA', 'BOTE_RESCATE', 'CAMION_BOMBEROS', 'BRIGADA_HUMANITARIA'
    codigo_identificador VARCHAR(40) UNIQUE NOT NULL,
    contacto_operador VARCHAR(100),
    estado VARCHAR(40) NOT NULL DEFAULT 'DISPONIBLE', -- 'DISPONIBLE', 'ASIGNADO', 'MANTENIMIENTO'
    ubicacion_actual GEOMETRY(Point, 4326),
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE recursos_operativos IS 'Vehículos, cuadrillas y brigadas de respuesta rápida del COE.';

CREATE TABLE IF NOT EXISTS asignaciones_recursos (
    id SERIAL PRIMARY KEY,
    reporte_id UUID NOT NULL REFERENCES reportes_incidentes(id) ON DELETE CASCADE,
    recurso_id INT NOT NULL REFERENCES recursos_operativos(id) ON DELETE CASCADE,
    operador_asigna_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    instrucciones TEXT,
    fecha_asignacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_liberacion TIMESTAMPTZ,
    completado BOOLEAN NOT NULL DEFAULT FALSE
);

COMMENT ON TABLE asignaciones_recursos IS 'Despacho de recursos hacia incidentes críticos.';

-- --------------------------------------------------------------------------------------
-- 6. MÓDULO 4: RUTAS DE EVACUACIÓN Y ALBERGUES TEMPORALES
-- Modelado de albergues dinámicos, vías bloqueadas y ruteo con ST_Distance
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS albergues_temporales (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(180) NOT NULL,
    direccion TEXT,
    contacto_responsable VARCHAR(150),
    telefono_contacto VARCHAR(30),
    capacidad_maxima INT NOT NULL CHECK (capacidad_maxima > 0),
    ocupacion_actual INT NOT NULL DEFAULT 0 CHECK (ocupacion_actual >= 0),
    ubicacion GEOMETRY(Point, 4326) NOT NULL,
    area_poligono GEOMETRY(Polygon, 4326),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    servicios_disponibles JSONB DEFAULT '{"cocina": true, "duchas": true, "generador_electrico": false, "atencion_medica": false}'::jsonb,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_capacidad_ocupacion CHECK (ocupacion_actual <= capacidad_maxima)
);

COMMENT ON TABLE albergues_temporales IS 'Albergues temporales y su capacidad dinámica en tiempo real (RF-04.1, RF-04.2).';

CREATE TABLE IF NOT EXISTS tramos_viales (
    id SERIAL PRIMARY KEY,
    nombre_via VARCHAR(150) NOT NULL,
    tipo_via VARCHAR(50) DEFAULT 'SECUNDARIA',
    estado estado_via_enum NOT NULL DEFAULT 'TRANSITABLE',
    geometria GEOMETRY(LineString, 4326) NOT NULL,
    descripcion_bloqueo TEXT,
    fecha_reporte_estado TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tramos_viales IS 'Trazados viales para análisis de rutas de evacuación evitando cortes (RF-04.3, RF-04.4).';

-- --------------------------------------------------------------------------------------
-- 7. MÓDULO 5: FAMILIAS AFECTADAS Y ASISTENCIA HUMANITARIA
-- Integridad transaccional ACID estricta para inventarios y censo protegido
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS familias_censo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_censo VARCHAR(50) UNIQUE NOT NULL,
    
    -- Datos del Representante de Hogar
    jefe_familia_nombre VARCHAR(180) NOT NULL,
    jefe_familia_cedula VARCHAR(10) NOT NULL,
    telefono_contacto VARCHAR(15),
    
    -- Georreferenciación de la vivienda afectada
    canton VARCHAR(50) NOT NULL DEFAULT 'Esmeraldas',
    parroquia VARCHAR(80),
    barrio_sector VARCHAR(120),
    direccion_referencia TEXT,
    ubicacion_vivienda GEOMETRY(Point, 4326),

    -- Composición del núcleo familiar
    numero_integrantes SMALLINT NOT NULL DEFAULT 1 CHECK (numero_integrantes >= 1),
    ninos_menores_5 SMALLINT NOT NULL DEFAULT 0 CHECK (ninos_menores_5 >= 0),
    adultos_mayores SMALLINT NOT NULL DEFAULT 0 CHECK (adultos_mayores >= 0),
    personas_discapacidad SMALLINT NOT NULL DEFAULT 0 CHECK (personas_discapacidad >= 0),

    -- Diagnóstico preliminar de afectación
    danos_vivienda VARCHAR(50) DEFAULT 'PARCIAL', -- 'TOTAL', 'PARCIAL', 'LEVE'
    requiere_evacuacion_inmediata BOOLEAN NOT NULL DEFAULT FALSE,
    albergue_asignado_id INT REFERENCES albergues_temporales(id) ON DELETE SET NULL,

    -- Auditoría del Censo
    censador_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_censo TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE familias_censo IS 'Censo oficial de familias damnificadas (ACID & Protección de Datos Personales).';

CREATE TABLE IF NOT EXISTS bodegas_acopio (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    responsable VARCHAR(150),
    telefono VARCHAR(30),
    direccion TEXT,
    ubicacion GEOMETRY(Point, 4326) NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE
);

COMMENT ON TABLE bodegas_acopio IS 'Centros de acopio y almacenamiento de kits de ayuda humanitaria.';

CREATE TABLE IF NOT EXISTS suministros_catalogo (
    id SERIAL PRIMARY KEY,
    codigo_sku VARCHAR(50) UNIQUE NOT NULL,
    nombre_suministro VARCHAR(150) NOT NULL,
    tipo tipo_suministro_enum NOT NULL,
    unidad_medida VARCHAR(30) NOT NULL, -- 'KIT', 'LITRO', 'RACION', 'UNIDAD'
    peso_kg NUMERIC(6,2),
    descripcion TEXT
);

COMMENT ON TABLE suministros_catalogo IS 'Catálogo estandarizado de kits y suministros de socorro.';

CREATE TABLE IF NOT EXISTS inventario_bodega (
    id SERIAL PRIMARY KEY,
    bodega_id INT NOT NULL REFERENCES bodegas_acopio(id) ON DELETE CASCADE,
    suministro_id INT NOT NULL REFERENCES suministros_catalogo(id) ON DELETE CASCADE,
    cantidad_disponible INT NOT NULL DEFAULT 0 CHECK (cantidad_disponible >= 0),
    stock_minimo_alerta INT NOT NULL DEFAULT 15,
    fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_bodega_suministro UNIQUE (bodega_id, suministro_id)
);

COMMENT ON TABLE inventario_bodega IS 'Stock disponible por bodega con restricción estricta de saldo no negativo.';

CREATE TABLE IF NOT EXISTS entregas_asistencia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    familia_id UUID NOT NULL REFERENCES familias_censo(id) ON DELETE RESTRICT,
    bodega_origen_id INT NOT NULL REFERENCES bodegas_acopio(id) ON DELETE RESTRICT,
    brigadista_entrega_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    fecha_entrega TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    observaciones TEXT,
    codigo_acta_digital VARCHAR(80) UNIQUE
);

COMMENT ON TABLE entregas_asistencia IS 'Registro cabecera de donación entregada a cada núcleo familiar.';

CREATE TABLE IF NOT EXISTS detalle_entrega_suministros (
    id SERIAL PRIMARY KEY,
    entrega_id UUID NOT NULL REFERENCES entregas_asistencia(id) ON DELETE CASCADE,
    suministro_id INT NOT NULL REFERENCES suministros_catalogo(id) ON DELETE RESTRICT,
    cantidad_entregada INT NOT NULL CHECK (cantidad_entregada > 0)
);

COMMENT ON TABLE detalle_entrega_suministros IS 'Líneas de suministros descontadas de bodega en cada entrega.';

-- --------------------------------------------------------------------------------------
-- 8. MÓDULO 6: INTELIGENCIA ARTIFICIAL Y ANÁLISIS PREDICTIVO
-- Repositorio histórico para entrenamiento de modelos y predicciones de apoyo
-- --------------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historico_eventos_riesgo (
    id SERIAL PRIMARY KEY,
    fecha_evento DATE NOT NULL,
    tipo_evento VARCHAR(80) NOT NULL,
    sector VARCHAR(150) NOT NULL,
    geometria GEOMETRY(Point, 4326) NOT NULL,
    precipitacion_estimada_mm NUMERIC(6,2),
    nivel_impacto gravedad_incidente_enum NOT NULL,
    familias_damnificadas INT DEFAULT 0,
    fuente_registro VARCHAR(100) DEFAULT 'Histórico INAMHI / SNGRE'
);

COMMENT ON TABLE historico_eventos_riesgo IS 'Dataset histórico para análisis predictivo y clustering en Scikit-learn.';

CREATE TABLE IF NOT EXISTS predicciones_escenarios (
    id SERIAL PRIMARY KEY,
    fecha_generacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    modelo_version VARCHAR(60) NOT NULL,
    tipo_escenario VARCHAR(100) NOT NULL, -- ej: 'PROBABILIDAD_DESBORDE_TEAONE'
    sector_evaluado VARCHAR(150) NOT NULL,
    probabilidad_riesgo NUMERIC(5,2) NOT NULL CHECK (probabilidad_riesgo >= 0 AND probabilidad_riesgo <= 100),
    nivel_prioridad_estimado gravedad_incidente_enum NOT NULL,
    variables_utilizadas JSONB,
    es_apoyo_experimental BOOLEAN NOT NULL DEFAULT TRUE,
    nota_legal TEXT DEFAULT 'Resultado experimental de apoyo a la decisión técnica; no sustituye el pronóstico oficial.'
);

COMMENT ON TABLE predicciones_escenarios IS 'Predicciones generadas por los modelos analíticos de Scikit-learn (RF-06.6).';

-- --------------------------------------------------------------------------------------
-- 9. ÍNDICES ESPACIALES (GIST) Y DE ALTO RENDIMIENTO (B-TREE)
-- Garantizan el cumplimiento de RNF-01 (Consultas espaciales menores a 2 segundos)
-- --------------------------------------------------------------------------------------

-- Índices Espaciales GiST
CREATE INDEX IF NOT EXISTS idx_usuarios_ubicacion_gist ON usuarios USING GIST (ubicacion_domicilio);
CREATE INDEX IF NOT EXISTS idx_zonas_riesgo_geom_gist ON zonas_riesgo USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_capas_hidricas_geom_gist ON capas_hidricas_viales USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_infraestructuras_geom_gist ON infraestructuras_esenciales USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_reportes_ubicacion_gist ON reportes_incidentes USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_alertas_poligono_gist ON alertas_tempranas USING GIST (poligono_afectacion);
CREATE INDEX IF NOT EXISTS idx_albergues_ubicacion_gist ON albergues_temporales USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_tramos_viales_geom_gist ON tramos_viales USING GIST (geometria);
CREATE INDEX IF NOT EXISTS idx_familias_ubicacion_gist ON familias_censo USING GIST (ubicacion_vivienda);
CREATE INDEX IF NOT EXISTS idx_bodegas_ubicacion_gist ON bodegas_acopio USING GIST (ubicacion);
CREATE INDEX IF NOT EXISTS idx_historico_geom_gist ON historico_eventos_riesgo USING GIST (geometria);

-- Índices B-Tree para claves foráneas y búsquedas recurrentes
CREATE INDEX IF NOT EXISTS idx_usuarios_telefono ON usuarios(telefono);
CREATE INDEX IF NOT EXISTS idx_usuarios_cedula ON usuarios(cedula);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

CREATE INDEX IF NOT EXISTS idx_reportes_estado ON reportes_incidentes(estado);
CREATE INDEX IF NOT EXISTS idx_reportes_gravedad ON reportes_incidentes(nivel_gravedad);
CREATE INDEX IF NOT EXISTS idx_reportes_fecha ON reportes_incidentes(fecha_incidente DESC);

CREATE INDEX IF NOT EXISTS idx_albergues_activo_cupo ON albergues_temporales(activo, ocupacion_actual, capacidad_maxima);
CREATE INDEX IF NOT EXISTS idx_tramos_viales_estado ON tramos_viales(estado);

CREATE INDEX IF NOT EXISTS idx_familias_cedula ON familias_censo(jefe_familia_cedula);
CREATE INDEX IF NOT EXISTS idx_familias_codigo ON familias_censo(codigo_censo);

CREATE INDEX IF NOT EXISTS idx_inventario_bodega ON inventario_bodega(bodega_id, suministro_id);

-- --------------------------------------------------------------------------------------
-- 10. DATOS SEMILLA INICIALES (SEED DATA PARA ESMERALDAS)
-- Datos reales y aproximados del territorio para pruebas inmediatas en Aiven
-- --------------------------------------------------------------------------------------

-- 10.1 Albergues Temporales Iniciales
INSERT INTO albergues_temporales (nombre, direccion, contacto_responsable, telefono_contacto, capacidad_maxima, ocupacion_actual, ubicacion)
VALUES 
('Unidad Educativa Luis Vargas Torres', 'Av. Kennedy y Olmedo, Esmeraldas', 'Ramiro Caicedo', '0984123456', 250, 45, ST_SetSRID(ST_Point(-79.6582, 0.9681), 4326)),
('Coliseo Nubia Villacís Díaz', 'Calle Pedro Vicente Maldonado, Esmeraldas', 'Maritza Bone', '0995234567', 400, 110, ST_SetSRID(ST_Point(-79.6548, 0.9654), 4326)),
('Unidad Educativa Margarita Cortés', 'Sector Las Palmas, Esmeraldas', 'Carlos Estupiñán', '0978345678', 180, 0, ST_SetSRID(ST_Point(-79.6489, 0.9912), 4326))
ON CONFLICT DO NOTHING;

-- 10.2 Infraestructura Esencial (Hospitales y Bomberos)
INSERT INTO infraestructuras_esenciales (nombre, tipo, direccion, telefono_contacto, ubicacion)
VALUES
('Hospital General Delfina Torres de Concha (Sur)', 'HOSPITAL', 'Sector San Rafael - Av. del Ejército', '062725890', ST_SetSRID(ST_Point(-79.6734, 0.9281), 4326)),
('Cuerpo de Bomberos de Esmeraldas - Estación Central', 'BOMBEROS', 'Calle Bolívar y 9 de Octubre', '062720102', ST_SetSRID(ST_Point(-79.6531, 0.9669), 4326)),
('Subcentro de Salud Las Palmas', 'CENTRO_SALUD', 'Av. Kennedy y Malecón Las Palmas', '062721456', ST_SetSRID(ST_Point(-79.6465, 0.9930), 4326))
ON CONFLICT DO NOTHING;

-- 10.3 Catálogo Básico de Asistencia Humanitaria
INSERT INTO suministros_catalogo (codigo_sku, nombre_suministro, tipo, unidad_medida, peso_kg, descripcion)
VALUES
('KIT-ALIM-EST', 'Kit de Alimentos Familiares para Emergencia (3 días)', 'ALIMENTO', 'KIT', 14.50, 'Arroz, aceite, atún, lentejas, avena, azúcar, sal.'),
('BIDON-AGUA-20L', 'Bidón de Agua Potable Sellada 20 Litros', 'AGUA', 'KIT', 20.00, 'Agua apta para consumo humano en envase reforzado.'),
('KIT-HIGIENE-FAM', 'Kit de Higiene y Aseo Personal', 'KIT_ASEO', 'KIT', 4.00, 'Jabón antibacterial, papel higiénico, pasta, cepillos dentales y toallas sanitarias.'),
('COLCHON-FRAZADA', 'Colchón de Espuma de 1 Plaza con Frazada Térmica', 'COLCHON_COBIJA', 'UNIDAD', 5.00, 'Colchón sintético impermeable para albergue.')
ON CONFLICT (codigo_sku) DO NOTHING;

-- 10.4 Zona Crítica de Inundación (Polígono de Referencia: Sector 50 Casas / Río Teaone)
INSERT INTO zonas_riesgo (nombre, tipo_evento, nivel_riesgo, descripcion, geometria)
VALUES
(
    'Sector Las 50 Casas - Ribera Río Teaone',
    'INUNDACION',
    'ALTO',
    'Zona de desbordamiento recurrente del río Teaone durante picos pluviométricos y marea alta.',
    ST_GeomFromText('POLYGON((-79.6710 0.9320, -79.6650 0.9320, -79.6640 0.9260, -79.6700 0.9250, -79.6710 0.9320))', 4326)
)
ON CONFLICT DO NOTHING;

COMMIT;
