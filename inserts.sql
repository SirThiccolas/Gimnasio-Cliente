-- MySQL dump 10.13
-- Database: railway (Cleaned & Seeded)
-- ------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;

-- 1. ADMINISTRADORES
TRUNCATE TABLE `administrador`;
INSERT INTO `administrador` (`nombre`, `apellido`, `dni`, `password`, `activo`, `rol`) VALUES 
('Carlos', 'Mendoza', '20394857A', 'a', 1, 'superadmin'),
('Laura', 'Giraldo', '39485762B', 'a', 1, 'admin'),
('Sergio', 'Peña', '58473625C', 'a', 1, 'admin'),
('Elena', 'Vasco', '10293847D', 'a', 1, 'superadmin'),
('Marta', 'Sanz', '67584930E', 'a', 1, 'admin'),
('Cristiano', 'Ronaldo', 'a', 'a', 1, 'superadmin');

-- 2. ACTIVIDADES
TRUNCATE TABLE `actividades`;
INSERT INTO `actividades` (`nombre`, `descripcion`, `aforo`, `duracion`, `activo`) VALUES 
('Hatha Yoga', 'Yoga tradicional centrado en la postura y respiración', 15, 60, 1),
('Spinning HIIT', 'Entrenamiento cardiovascular de alta intensidad en bicicleta', 20, 45, 1),
('Body Pump', 'Entrenamiento con pesas al ritmo de la música', 25, 60, 1),
('Zumba Gold', 'Baile activo ideal para todas las edades', 30, 50, 1),
('Cross Training', 'Circuito de fuerza y resistencia funcional', 12, 60, 1),
('Aquafit', 'Gimnasia acuática de bajo impacto', 15, 45, 1),
('Pilates Suelo', 'Control mental y físico para fortalecer el core', 15, 55, 1),
('Kickboxing', 'Técnicas de combate para quema de grasa', 10, 60, 1),
('Yoga Vinyasa', 'Yoga dinámico y fluido', 12, 60, 1),
('Abdominales Express', 'Sesión intensiva de zona media', 20, 15, 1);

-- 3. INSTRUCTORES
TRUNCATE TABLE `instructores`;
INSERT INTO `instructores` (`nombre`, `apellido`, `dni`, `activo`, `fecha_alta`) VALUES 
('Roberto', 'Gómez', '12345678X', 1, '2024-01-15'),
('Clara', 'Fuentes', '87654321Y', 1, '2024-02-10'),
('Marcos', 'Polo', '11223344J', 1, '2024-03-05'),
('Sofia', 'Reyes', '44332211K', 1, '2024-05-20'),
('Julian', 'Casas', '55667788L', 1, '2024-06-12'),
('Beatriz', 'Luna', '99887766M', 1, '2024-08-01'),
('Adrian', 'Silva', '22334455N', 1, '2024-09-15'),
('Cristiano', 'Penaldo', '22334895N', 1, '2024-09-15'),
('Lionel', 'Fressi', '22334423N', 1, '2024-09-15'),
('Monicius', 'Silva', '22334458N', 1, '2024-09-15');

-- 4. CLIENTES
TRUNCATE TABLE `clientes`;
INSERT INTO `clientes` (`dni`, `nombre`, `apellido`, `IBAN`, `telefono`, `cod_postal`, `activo`, `fecha_alta`, `password`) VALUES 
('48573625W', 'Javier', 'Serrano', 'ES3021000456789012345678', 611223344, 28001, 1, '2025-10-10', 'pass123'),
('39485761Q', 'Lucía', 'Benítez', 'ES3021000456789012349999', 622334455, 08005, 1, '2025-11-02', 'pass123'),
('10293846P', 'Andrés', 'Castro', 'ES3021000456789012348888', 633445566, 41002, 1, '2025-11-15', 'pass123'),
('57483920O', 'Marina', 'Ortiz', 'ES3021000456789012347777', 644556677, 29003, 1, '2025-12-01', 'pass123'),
('68594031I', 'Teresa', 'Gil', 'ES3021000456789012346666', 655667788, 50001, 1, '2025-12-10', 'pass123'),
('29384756U', 'Raúl', 'Domínguez', 'ES3021000456789012345555', 666778899, 46001, 1, '2026-01-05', 'pass123'),
('84756302T', 'Carla', 'Navarro', 'ES3021000456789012344444', 677889900, 08010, 1, '2026-01-15', 'pass123'),
('11223344R', 'Iván', 'Eslava', 'ES3021000456789012343333', 688990011, 28014, 1, '2026-01-20', 'pass123'),
('99887766S', 'Marta', 'Vila', 'ES3021000456789012342222', 699112233, 08020, 1, '2026-01-21', 'pass123'),
('55443322A', 'Pedro', 'Picazo', 'ES3021000456789012341111', 611009988, 50005, 1, '2026-01-22', 'pass123'),
('12121212B', 'Elena', 'Beltrán', 'ES3021000456789012340000', 622445566, 41010, 1, '2026-01-22', 'pass123'),
('34343434C', 'Hugo', 'Sánchez', 'ES3021000456789012341212', 633778899, 28045, 1, '2026-01-23', 'pass123'),
('56565656D', 'Isabel', 'Ramos', 'ES3021000456789012343434', 644223311, 08032, 1, '2026-01-24', 'pass123'),
('78787878E', 'Fernando', 'Romero', 'ES3021000456789012345656', 655889977, 29010, 1, '2026-01-25', 'pass123'),
('90909090F', 'Alicia', 'Torres', 'ES3021000456789012347878', 666112244, 46020, 1, '2026-01-25', 'pass123'),
('13572468G', 'Oscar', 'Pérez', 'ES3021000456789012349090', 677334455, 30001, 1, '2026-01-26', 'pass123'),
('24681357H', 'Paula', 'Moya', 'ES3021000456789012341357', 688556611, 11005, 1, '2026-01-26', 'pass123'),
('11122233K', 'Samuel', 'León', 'ES3021000456789012342468', 699221144, 35001, 1, '2026-01-27', 'pass123'),
('44455566L', 'Gloria', 'Sanz', 'ES3021000456789012341112', 611554433, 07001, 1, '2026-01-27', 'pass123'),
('77788899M', 'David', 'Cano', 'ES3021000456789012344445', 622001122, 18001, 1, '2026-01-28', 'pass123'),
('a', 'Pruebas', 'Pruebas', 'ES3021000456789012344989', 622001999, 18999, 1, '2026-01-28', 'a');


-- 5. CLASES (Relacionando Instructores con Actividades)
TRUNCATE TABLE `clases`;
INSERT INTO `clases` (`id_instructor`, `id_actividad`, `dia`, `hora_inicio`, `status`) VALUES 
(1, 1, 'Lunes', '09:00:00', 'confirmado'),
(2, 2, 'Lunes', '10:30:00', 'confirmado'),
(3, 3, 'Martes', '18:00:00', 'confirmado'),
(4, 4, 'Martes', '19:15:00', 'confirmado'),
(5, 5, 'Miércoles', '08:00:00', 'confirmado'),
(6, 6, 'Miércoles', '11:00:00', 'confirmado'),
(7, 7, 'Jueves', '17:30:00', 'confirmado'),
(1, 8, 'Jueves', '19:00:00', 'confirmado'),
(2, 9, 'Viernes', '09:00:00', 'confirmado'),
(3, 10, 'Viernes', '14:00:00', 'confirmado'),
(4, 5, 'Sábado', '10:00:00', 'confirmado'),
(5, 2, 'Sábado', '11:30:00', 'confirmado');

-- 6. INSCRIPCIONES (Relacionando Clientes con Clases)
TRUNCATE TABLE `inscripciones`;
INSERT INTO `inscripciones` (`id_clase`, `id_cliente`, `status`, `dia_reserva`, `fecha_clase`) VALUES 
(1, 1, 'confirmado', '2026-01-25', '2026-02-02'),
(1, 2, 'confirmado', '2026-01-25', '2026-02-02'),
(3, 3, 'usado', '2026-01-20', '2026-01-27'),
(4, 4, 'confirmado', '2026-01-26', '2026-01-27'),
(5, 5, 'confirmado', '2026-01-27', '2026-01-28'),
(6, 6, 'cancelado', '2026-01-24', '2026-01-28'),
(7, 7, 'confirmado', '2026-01-28', '2026-01-29'),
(10, 8, 'confirmado', '2026-01-29', '2026-01-30'),
(2, 1, 'confirmado', '2026-01-26', '2026-02-02');

-- 7. NOTIFICACIONES
TRUNCATE TABLE `notificaciones`;
INSERT INTO `notificaciones` (`id_cliente`, `descripcion`, `fecha_notificacion`, `leido`) VALUES 
(1, '¡Bienvenido al sistema! Tu suscripción está activa.', '2025-10-10 09:00:00', 1),
(2, 'Recordatorio: Tu clase de Spinning empieza en 1 hora.', '2026-01-20 09:30:00', 1),
(6, 'Tu clase de Aquafit ha sido reprogramada por mantenimiento.', '2026-01-24 10:15:00', 0),
(4, 'Reserva confirmada: Zumba Gold para mañana.', '2026-01-26 12:00:00', 1),
(3, 'Gracias por asistir a Cross Training. ¡Valora tu clase!', '2026-01-27 19:30:00', 0);

-- 8. MIGRACIONES (Simulando un historial de Laravel u otro framework)
TRUNCATE TABLE `migrations`;
INSERT INTO `migrations` (`migration`, `batch`) VALUES 
('0001_01_01_000000_create_base_tables', 1),
('2026_01_10_000000_add_roles_to_admin', 1);

/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;