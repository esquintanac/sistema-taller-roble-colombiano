-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: localhost    Database: mydb
-- ------------------------------------------------------
-- Server version	8.0.43

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `auth_group`
--

DROP TABLE IF EXISTS `auth_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group`
--

LOCK TABLES `auth_group` WRITE;
/*!40000 ALTER TABLE `auth_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_group_permissions`
--

DROP TABLE IF EXISTS `auth_group_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_group_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_group_permissions_group_id_permission_id_0cd325b0_uniq` (`group_id`,`permission_id`),
  KEY `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_group_permissio_permission_id_84c5c92e_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_group_permissions_group_id_b120cbf9_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_group_permissions`
--

LOCK TABLES `auth_group_permissions` WRITE;
/*!40000 ALTER TABLE `auth_group_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_group_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_permission`
--

DROP TABLE IF EXISTS `auth_permission`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_permission` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int NOT NULL,
  `codename` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_permission_content_type_id_codename_01ab375a_uniq` (`content_type_id`,`codename`),
  CONSTRAINT `auth_permission_content_type_id_2f476e4b_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_permission`
--

LOCK TABLES `auth_permission` WRITE;
/*!40000 ALTER TABLE `auth_permission` DISABLE KEYS */;
INSERT INTO `auth_permission` VALUES (1,'Can add log entry',1,'add_logentry'),(2,'Can change log entry',1,'change_logentry'),(3,'Can delete log entry',1,'delete_logentry'),(4,'Can view log entry',1,'view_logentry'),(5,'Can add permission',3,'add_permission'),(6,'Can change permission',3,'change_permission'),(7,'Can delete permission',3,'delete_permission'),(8,'Can view permission',3,'view_permission'),(9,'Can add group',2,'add_group'),(10,'Can change group',2,'change_group'),(11,'Can delete group',2,'delete_group'),(12,'Can view group',2,'view_group'),(13,'Can add user',4,'add_user'),(14,'Can change user',4,'change_user'),(15,'Can delete user',4,'delete_user'),(16,'Can view user',4,'view_user'),(17,'Can add content type',5,'add_contenttype'),(18,'Can change content type',5,'change_contenttype'),(19,'Can delete content type',5,'delete_contenttype'),(20,'Can view content type',5,'view_contenttype'),(21,'Can add session',6,'add_session'),(22,'Can change session',6,'change_session'),(23,'Can delete session',6,'delete_session'),(24,'Can view session',6,'view_session');
/*!40000 ALTER TABLE `auth_permission` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user`
--

DROP TABLE IF EXISTS `auth_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user` (
  `id` int NOT NULL AUTO_INCREMENT,
  `password` varchar(128) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_login` datetime(6) DEFAULT NULL,
  `is_superuser` tinyint(1) NOT NULL,
  `username` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `first_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(254) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_staff` tinyint(1) NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `date_joined` datetime(6) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user`
--

LOCK TABLES `auth_user` WRITE;
/*!40000 ALTER TABLE `auth_user` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_groups`
--

DROP TABLE IF EXISTS `auth_user_groups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_groups` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `group_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_groups_user_id_group_id_94350c0c_uniq` (`user_id`,`group_id`),
  KEY `auth_user_groups_group_id_97559544_fk_auth_group_id` (`group_id`),
  CONSTRAINT `auth_user_groups_group_id_97559544_fk_auth_group_id` FOREIGN KEY (`group_id`) REFERENCES `auth_group` (`id`),
  CONSTRAINT `auth_user_groups_user_id_6a12ed8b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_groups`
--

LOCK TABLES `auth_user_groups` WRITE;
/*!40000 ALTER TABLE `auth_user_groups` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_groups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auth_user_user_permissions`
--

DROP TABLE IF EXISTS `auth_user_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auth_user_user_permissions` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `permission_id` int NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `auth_user_user_permissions_user_id_permission_id_14a6b632_uniq` (`user_id`,`permission_id`),
  KEY `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` (`permission_id`),
  CONSTRAINT `auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm` FOREIGN KEY (`permission_id`) REFERENCES `auth_permission` (`id`),
  CONSTRAINT `auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auth_user_user_permissions`
--

LOCK TABLES `auth_user_user_permissions` WRITE;
/*!40000 ALTER TABLE `auth_user_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `auth_user_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cliente`
--

DROP TABLE IF EXISTS `cliente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cliente` (
  `id_cliente` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Apellido` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Tipo_documento_identificacion` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Numero_documento_identificacion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Telefono_cliente` varchar(15) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Correo_cliente` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Direccion_cliente` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha_registro` datetime NOT NULL,
  PRIMARY KEY (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cliente`
--

LOCK TABLES `cliente` WRITE;
/*!40000 ALTER TABLE `cliente` DISABLE KEYS */;
INSERT INTO `cliente` VALUES (1,'Andrés','Gómez','CC','1010101010','3001234567','andres@gmail.com','Calle 45 #12-30','2026-08-14 14:43:19'),(5,'Laura','Diaz','CC','3030303030','','laurad@gmail.com','','2026-08-15 17:51:58');
/*!40000 ALTER TABLE `cliente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detallefactura`
--

DROP TABLE IF EXISTS `detallefactura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallefactura` (
  `id_detalle` int NOT NULL AUTO_INCREMENT,
  `id_factura` int NOT NULL,
  `id_material` int NOT NULL,
  `Cantidad` decimal(10,2) NOT NULL,
  `Precio_unitario` decimal(10,2) NOT NULL,
  `Subtotal` decimal(10,2) NOT NULL,
  PRIMARY KEY (`id_detalle`),
  KEY `id_factura_idx` (`id_factura`),
  KEY `id_material_idx` (`id_material`),
  CONSTRAINT `id_factura` FOREIGN KEY (`id_factura`) REFERENCES `factura` (`id_factura`),
  CONSTRAINT `id_material` FOREIGN KEY (`id_material`) REFERENCES `material` (`id_material`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detallefactura`
--

LOCK TABLES `detallefactura` WRITE;
/*!40000 ALTER TABLE `detallefactura` DISABLE KEYS */;
INSERT INTO `detallefactura` VALUES (1,4,1,3.82,85000.00,324700.00),(2,4,4,48.00,8500.00,408000.00);
/*!40000 ALTER TABLE `detallefactura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_admin_log`
--

DROP TABLE IF EXISTS `django_admin_log`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_admin_log` (
  `id` int NOT NULL AUTO_INCREMENT,
  `action_time` datetime(6) NOT NULL,
  `object_id` longtext COLLATE utf8mb4_unicode_ci,
  `object_repr` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action_flag` smallint unsigned NOT NULL,
  `change_message` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `content_type_id` int DEFAULT NULL,
  `user_id` int NOT NULL,
  PRIMARY KEY (`id`),
  KEY `django_admin_log_content_type_id_c4bce8eb_fk_django_co` (`content_type_id`),
  KEY `django_admin_log_user_id_c564eba6_fk_auth_user_id` (`user_id`),
  CONSTRAINT `django_admin_log_content_type_id_c4bce8eb_fk_django_co` FOREIGN KEY (`content_type_id`) REFERENCES `django_content_type` (`id`),
  CONSTRAINT `django_admin_log_user_id_c564eba6_fk_auth_user_id` FOREIGN KEY (`user_id`) REFERENCES `auth_user` (`id`),
  CONSTRAINT `django_admin_log_chk_1` CHECK ((`action_flag` >= 0))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_admin_log`
--

LOCK TABLES `django_admin_log` WRITE;
/*!40000 ALTER TABLE `django_admin_log` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_admin_log` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_content_type`
--

DROP TABLE IF EXISTS `django_content_type`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_content_type` (
  `id` int NOT NULL AUTO_INCREMENT,
  `app_label` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `model` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `django_content_type_app_label_model_76bd3d3b_uniq` (`app_label`,`model`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_content_type`
--

LOCK TABLES `django_content_type` WRITE;
/*!40000 ALTER TABLE `django_content_type` DISABLE KEYS */;
INSERT INTO `django_content_type` VALUES (1,'admin','logentry'),(2,'auth','group'),(3,'auth','permission'),(4,'auth','user'),(5,'contenttypes','contenttype'),(6,'sessions','session');
/*!40000 ALTER TABLE `django_content_type` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_migrations`
--

DROP TABLE IF EXISTS `django_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_migrations` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `app` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `applied` datetime(6) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_migrations`
--

LOCK TABLES `django_migrations` WRITE;
/*!40000 ALTER TABLE `django_migrations` DISABLE KEYS */;
INSERT INTO `django_migrations` VALUES (1,'contenttypes','0001_initial','2026-08-11 00:12:02.359737'),(2,'auth','0001_initial','2026-08-11 00:12:22.306049'),(3,'admin','0001_initial','2026-08-11 00:12:25.525051'),(4,'admin','0002_logentry_remove_auto_add','2026-08-11 00:12:25.717600'),(5,'admin','0003_logentry_add_action_flag_choices','2026-08-11 00:12:25.777453'),(6,'contenttypes','0002_remove_content_type_name','2026-08-11 00:12:28.850251'),(7,'auth','0002_alter_permission_name_max_length','2026-08-11 00:12:30.899303'),(8,'auth','0003_alter_user_email_max_length','2026-08-11 00:12:31.332037'),(9,'auth','0004_alter_user_username_opts','2026-08-11 00:12:31.403915'),(10,'auth','0005_alter_user_last_login_null','2026-08-11 00:12:32.810660'),(11,'auth','0006_require_contenttypes_0002','2026-08-11 00:12:32.853161'),(12,'auth','0007_alter_validators_add_error_messages','2026-08-11 00:12:32.915199'),(13,'auth','0008_alter_user_username_max_length','2026-08-11 00:12:34.325972'),(14,'auth','0009_alter_user_last_name_max_length','2026-08-11 00:12:35.941653'),(15,'auth','0010_alter_group_name_max_length','2026-08-11 00:12:36.194355'),(16,'auth','0011_update_proxy_permissions','2026-08-11 00:12:36.251718'),(17,'auth','0012_alter_user_first_name_max_length','2026-08-11 00:12:38.937773'),(18,'sessions','0001_initial','2026-08-11 00:12:40.342047');
/*!40000 ALTER TABLE `django_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `django_session`
--

DROP TABLE IF EXISTS `django_session`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `django_session` (
  `session_key` varchar(40) COLLATE utf8mb4_unicode_ci NOT NULL,
  `session_data` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `expire_date` datetime(6) NOT NULL,
  PRIMARY KEY (`session_key`),
  KEY `django_session_expire_date_a5c62663` (`expire_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `django_session`
--

LOCK TABLES `django_session` WRITE;
/*!40000 ALTER TABLE `django_session` DISABLE KEYS */;
/*!40000 ALTER TABLE `django_session` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `factura`
--

DROP TABLE IF EXISTS `factura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `factura` (
  `id_factura` int NOT NULL AUTO_INCREMENT,
  `Fecha_pago` datetime NOT NULL,
  `Valor_total` decimal(10,2) NOT NULL,
  `Estado_pago` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Metodo_pago` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_modelo` int NOT NULL,
  `id_cliente` int NOT NULL,
  PRIMARY KEY (`id_factura`),
  KEY `íd_modelo_idx` (`id_modelo`),
  KEY `fk_Factura_Cliente1_idx` (`id_cliente`),
  CONSTRAINT `fk_Factura_Cliente1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  CONSTRAINT `íd_modelo` FOREIGN KEY (`id_modelo`) REFERENCES `modelo` (`id_modelo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `factura`
--

LOCK TABLES `factura` WRITE;
/*!40000 ALTER TABLE `factura` DISABLE KEYS */;
INSERT INTO `factura` VALUES (2,'2026-09-17 17:14:10',732700.00,'Pendiente','Efectivo',1,1),(3,'2026-09-18 18:10:08',732700.00,'Pendiente','Efectivo',1,1),(4,'2026-09-18 18:26:49',732700.00,'Pendiente','Efectivo',1,1);
/*!40000 ALTER TABLE `factura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial`
--

DROP TABLE IF EXISTS `historial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial` (
  `id_historial` int NOT NULL AUTO_INCREMENT,
  `id_modelo` int NOT NULL,
  `id_usuario` int NOT NULL,
  `Comentario` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha_creacion` datetime NOT NULL,
  `Estado_revision` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Accion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `id_cliente` int NOT NULL,
  PRIMARY KEY (`id_historial`),
  KEY `id_modelo_idx` (`id_modelo`),
  KEY `id_usuario_idx` (`id_usuario`),
  KEY `id_cliente_idx` (`id_cliente`),
  CONSTRAINT `fk_Historial_Cliente` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`),
  CONSTRAINT `fk_Historial_Modelo` FOREIGN KEY (`id_modelo`) REFERENCES `modelo` (`id_modelo`),
  CONSTRAINT `fk_Historial_Usuario` FOREIGN KEY (`id_usuario`) REFERENCES `usuario` (`id_usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial`
--

LOCK TABLES `historial` WRITE;
/*!40000 ALTER TABLE `historial` DISABLE KEYS */;
INSERT INTO `historial` VALUES (1,3,1,'','2026-09-17 14:22:40','Revisado','Revisión de diseño',1),(2,4,5,'','2026-09-29 19:19:21','Nuevo','Creación de diseño',5),(3,5,5,'','2026-09-30 12:32:08','Nuevo','Creación de diseño',1),(4,6,5,'','2026-09-30 12:38:54','Nuevo','Creación de diseño',5),(5,7,5,'','2026-09-30 13:57:04','Nuevo','Creación de diseño',1),(6,8,5,'','2026-09-30 13:58:44','Nuevo','Creación de diseño',5);
/*!40000 ALTER TABLE `historial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `material`
--

DROP TABLE IF EXISTS `material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `material` (
  `id_material` int NOT NULL AUTO_INCREMENT,
  `Nombre_material` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Tipo_material` varchar(45) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Unidad_medida` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Costo_unitario` decimal(10,2) NOT NULL,
  `Stock` decimal(10,2) DEFAULT NULL,
  `Stock_minimo` decimal(10,2) DEFAULT NULL,
  `Fecha_registro` datetime NOT NULL,
  PRIMARY KEY (`id_material`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `material`
--

LOCK TABLES `material` WRITE;
/*!40000 ALTER TABLE `material` DISABLE KEYS */;
INSERT INTO `material` VALUES (1,'Melamina blanca 18mm','Tablero','Lamina',85000.00,25.00,7.00,'2026-07-21 19:02:29'),(2,'Melanina wengue 18mm','Tablero','Lamina',92000.00,25.00,8.00,'2026-07-21 19:02:29'),(3,'MDF 3mm','Tablero','Lamina',4800.00,55.00,15.00,'2026-07-21 19:02:29'),(4,'Tornillo 1 pulgada','Ferreteria','Caja',8500.00,100.00,20.00,'2026-07-21 19:02:29'),(6,'Bisagra recta','Herraje','Unidad',3200.00,80.00,20.00,'2026-07-21 19:02:29'),(7,'Correderas telescopicas','Herraje','Par',18500.00,30.00,10.00,'2026-07-21 19:02:29'),(8,'Barra colgadora aluminio','Herraje','Metro',14000.00,45.00,12.00,'2026-07-21 19:02:29'),(9,'Manija metalica','Herraje','Unidad',10000.00,82.00,100.00,'2026-07-21 21:16:56'),(15,'Barra colgadora metal','Herraje','Metro',25000.00,15.00,9.00,'2026-08-13 13:52:07');
/*!40000 ALTER TABLE `material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modelo`
--

DROP TABLE IF EXISTS `modelo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modelo` (
  `id_modelo` int NOT NULL AUTO_INCREMENT,
  `id_carpintero` int DEFAULT NULL,
  `Nombre_modelo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Alto` decimal(10,2) NOT NULL,
  `Ancho` decimal(10,2) NOT NULL,
  `Largo` decimal(10,2) NOT NULL,
  `Grosor` int NOT NULL DEFAULT '18',
  `Puertas` int DEFAULT NULL,
  `Compartimientos` int DEFAULT NULL,
  `Entrepanos_compartimientos` int DEFAULT NULL,
  `Cajones` int DEFAULT NULL,
  `Color` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Altura_barra_colgadora` decimal(10,2) DEFAULT NULL,
  `Tipo_puerta` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Altura_zocalo` decimal(10,2) DEFAULT NULL,
  `Material_fondo` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Piezas_cortar` int DEFAULT NULL,
  `Estado_modelo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha_creacion` datetime NOT NULL,
  `id_cliente` int NOT NULL,
  PRIMARY KEY (`id_modelo`),
  KEY `fk_Modelo_Cliente1_idx` (`id_cliente`),
  KEY `fk_Modelo_Carpintero` (`id_carpintero`),
  CONSTRAINT `fk_Modelo_Carpintero` FOREIGN KEY (`id_carpintero`) REFERENCES `usuario` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_Modelo_Cliente1` FOREIGN KEY (`id_cliente`) REFERENCES `cliente` (`id_cliente`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modelo`
--

LOCK TABLES `modelo` WRITE;
/*!40000 ALTER TABLE `modelo` DISABLE KEYS */;
INSERT INTO `modelo` VALUES (1,1,'Closet Andrés','',200.00,120.00,60.00,18,2,0,2,0,'',0.00,'',0.00,'Melanina',9,'Creado','2026-09-16 13:43:33',1),(2,1,'Closet Andrés','',200.00,120.00,60.00,18,2,0,2,0,'',0.00,'',0.00,'Melanina',9,'Creado','2026-09-16 13:55:08',1),(3,1,'Closet Prueba Historial','',200.00,120.00,60.00,18,2,0,2,0,'',0.00,'',0.00,'Melanina',9,'Creado','2026-09-17 14:22:35',1),(4,5,'Closet','',250.00,60.00,80.00,18,2,3,1,5,'',0.00,'corrediza',0.00,'',7,'Creado','2026-09-29 19:19:20',5),(5,5,'Mueble','',130.00,90.00,60.00,15,3,4,2,1,'',0.00,'abatible',0.00,'',9,'Creado','2026-09-30 12:32:03',1),(6,5,'Closet','',200.00,180.00,55.00,18,4,3,3,4,'',175.00,'abatible',0.00,'',11,'Creado','2026-09-30 12:38:54',5),(7,5,'Closet','',40.00,30.00,30.00,18,1,1,0,1,'',0.00,'corrediza',0.00,'',5,'Creado','2026-09-30 13:56:52',1),(8,5,'Closet','',200.00,100.00,80.00,9,1,3,3,2,'',0.00,'abatible',0.00,'',8,'Creado','2026-09-30 13:58:44',5);
/*!40000 ALTER TABLE `modelo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modelo_material`
--

DROP TABLE IF EXISTS `modelo_material`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modelo_material` (
  `id_material` int NOT NULL,
  `id_modelo_material` int NOT NULL AUTO_INCREMENT,
  `Cantidad` decimal(10,2) NOT NULL,
  `Unidad_medida` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Costo_utilizado` decimal(10,2) NOT NULL,
  `id_modelo` int NOT NULL,
  PRIMARY KEY (`id_modelo_material`),
  KEY `fk_Usuario_has_Material_Material1_idx` (`id_material`),
  KEY `id_modelo_idx` (`id_modelo`),
  CONSTRAINT `fk_modmat_Material` FOREIGN KEY (`id_material`) REFERENCES `material` (`id_material`),
  CONSTRAINT `fk_modmat_Modelo` FOREIGN KEY (`id_modelo`) REFERENCES `modelo` (`id_modelo`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modelo_material`
--

LOCK TABLES `modelo_material` WRITE;
/*!40000 ALTER TABLE `modelo_material` DISABLE KEYS */;
INSERT INTO `modelo_material` VALUES (1,1,3.82,'Lámina',324700.00,1),(4,2,48.00,'Caja',408000.00,1);
/*!40000 ALTER TABLE `modelo_material` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `id_usuario` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(255) NOT NULL,
  `Apellido` varchar(255) NOT NULL,
  `Correo` varchar(100) NOT NULL,
  `Telefono` varchar(15) DEFAULT NULL,
  `Usuario` varchar(255) NOT NULL,
  `Contrasena` varchar(255) NOT NULL,
  `Rol_usuario` enum('Carpintero','Administrador','Gerente_ventas') NOT NULL,
  PRIMARY KEY (`id_usuario`),
  UNIQUE KEY `Correo_UNIQUE` (`Correo`),
  UNIQUE KEY `Usuario_UNIQUE` (`Usuario`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'Ana','Ruiz','anar@gmail.com','','anaruiz','pbkdf2_sha256$1200000$QAQtMxFkQzrWTmVJrzPbRw$TGeE71mEmYINGyed2747XO7Czz9aXe6hCjPrzWYw5/k=','Carpintero'),(2,'Juan','Perez','jperez@gmail.com','','juanperez','pbkdf2_sha256$1200000$GJjXSUHm1tomYbuy6bqUtE$jlmp9UsVXCS/7PAA/MK66YzyYSrlcUeTZOxWJneKyqU=','Carpintero'),(3,'Luis','Lopez','llopez@gmail.com','','luislopez','pbkdf2_sha256$1200000$p9l6HExS8qDkfWoxtEuUJ7$89aG3PR3Rqu7MfI1KS/VWBeV1bbXmkLZ0GfLrV4VF9w=','Administrador'),(4,'Eric','Quintana','ericsantiagoquintanacabra@gmail.com','3145177061','admin01','pbkdf2_sha256$1200000$P3BO6WgLm449fNfZprA5bO$eY7lPWoeYn2rtJW1kMTtRjMyk2HSXg/jn7hxxOTfyVs=','Administrador'),(5,'Pedro','Rodriguez','prodriguez@mail.com','123456789','carpintero02','pbkdf2_sha256$1200000$cvrVQH4FvDzDunH3fBvuyF$nxUNMp4pCCoz9RxLaq6rzSZ0WpVQx9vH4Dxw4dLqI9s=','Carpintero');
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-01 20:32:01
