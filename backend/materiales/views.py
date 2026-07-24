"""
Modulo de vistas (Controlador) del modulo Material.
Proyecto : Sistema Gestion de Inventarios y Diseño Grafico - Taller del Roble Colombiano
Ruta     : backend/materiales/views.py

Este archivo contiene todas las vistas del modulo Material, que actuan
como el Controlador dentro del patron MTV (Model-Template-View) de
Django, equivalente al patron MVC definido en la arquitectura del
proyecto. Cada vista conecta el formulario/pagina (Template) con la
logica de acceso de datos (Model/DAO).
"""


from django.shortcuts import render, redirect, get_object_or_404
from src.dao.material_dao import MaterialDAO
from src.models.material import Material

# Instancia unica del DAO reutilizada por todas las vistas de este modulo
dao = MaterialDAO()

# Create your views here.
def registrar_material(request):

    """
    Vista para registrar un nuevo material (operacion CREATE del CRUD).

    - Si el metodo es GET: muestra el formulario vacio.
    - Si el metodo es POST: valida y guarda el nuevo material en la
    base de datos usando el DAO, luego redirige a la confirmacion.

    Args:
        request (HttpRequest): Objeto de solicitud HTTP de Django.
    
    Returns:
        HttpResponse: renderiza el formulario, un error, o redirige
        a la pagina de confirmacion segun el resultado.
    """

    # Metodo GET
    if request.method == "GET":
        return render(request, "materiales/formulario.html")

    # Metodo POST
    if request.method == "POST":
        nombre_material = request.POST.get("nombre_material")
        tipo_material = request.POST.get("tipo_material")
        unidad_medida = request.POST.get("unidad_medida")
        costo_unitario = request.POST.get("costo_unitario")
        stock = request.POST.get("stock")
        stock_minimo = request.POST.get("stock_minimo")

        # Validacion basica antes de conectar con la base de datos
        if not nombre_material or not tipo_material:
            return render(request, "materiales/formulario.html", {
                "error": "El nombre y tipo de material son obligatorios."
            })

        try:
            nuevo_material = Material(
                nombre_material=nombre_material,
                tipo_material=tipo_material,
                unidad_medida=unidad_medida,
                costo_unitario=float(costo_unitario),
                stock=float(stock),
                stock_minimo=float(stock_minimo),
            )

            # Conexion con la base de datos
            exito = dao.insertar_material(nuevo_material)

            if exito:
                return redirect("materiales:confirmacion")
            else:
                return redirect(request, "materiales/error.html", {
                    "mensaje": "No se puede guardar el material en la base de datos."
                })

        except ValueError:
            return render(request, "materiales/formulario.html", {
                "error": "Los campos numericos deben contener valores validos."
            })

def listar_materiales(request):
    """
    Vista para consultar y mostrar todos los materiales registrados
    (operacion READ del CRUD).

    Args:
        request (HttpRequest): objeto de solicitud HTTP de Django.
    
    Returns:
        HttpResponse: renderiza la tabla con todos los materiales
        obtenidos desde la base de datos a traves del DAO.
    """
    materiales = dao.consultar_materiales()
    return render(request, "materiales/lista.html", {"materiales": materiales})

def editar_material(request, id_material):
    """
    Vista para actualizar un material existente (operacion UPDATE del CRUD).

    - Si el metodo es GET: consulta el material por su ID y precarga
    el formulario con sus datos actuales.
    - Si el metodo es POST: recibe los nuevos valores, actualiza el
    registro en la base de datos y redirige a la lista.

    Args:
        request (HttpRequest): objeto de solicitud HTTP de Django.
        id_material (int): identificador del material a editar,
        recibido desde la URL.
    
    Returns:
        HttpResponse: renderiza el formulario de edicion precargado,
        o redirige a la lista tras actualizar exitosamente.
    """
    material = dao.consultar_material_por_id(id_material)

    if material is None:
        return render(request, "materiales/error.html", {
            "mensaje": f"No se encontro el material con el ID: {id_material}."
        })

    if request.method == "GET":
        return render(request, "materiales/editar.html",  {"material": material})

    if request.method == "POST":
        try:
            material.nombre_material = request.POST.get("nombre_material")
            material.tipo_material = request.POST.get("tipo_material")
            material.unidad_medida = request.POST.get("unidad_medida")
            material.costo_unitario = float(request.POST.get("costo_unitario"))
            material.stock = float(request.POST.get("stock"))
            material.stock_minimo = float(request.POST.get("stock_minimo"))

            exito = dao.actualizar_material(material)

            if exito:
                return redirect("materiales:lista")

            return render(request, "materiales/error.html", {
                "mensaje": "No se pudo actualizar el material."
            })

        except ValueError:
            return render(request, "materiales/editar.html", {
                "material": material,
                "error": "Los campos numericos deben tener valores validos.",
            })

def eliminar_material(request, id_material):
    """
    Vista para eliminar un material existente (operacion DELETE del CRUD)

    Solicita confirmacion antes de eliminar (GET muestra la pantalla
    de confirmacion; POST ejecuta la eliminacion real).

    Args:
        request (HttpRequest): objeto de solicitud HTTP de Django.
        id_material (int): identificador del material a eliminar.
    
    Returns:
        HttpResponse: renderiza la confirmacion de borrado o redirige
        a la lista despues de eliminar exitosamente.
    """

    material = dao.consultar_material_por_id(id_material)

    if material is None:
        return render(request, "materiales/error.html", {
            "mensaje": f"No se encontro el material con ID: {id_material}"
        })

    if request.method == "GET":
        return render(request, "materiales/eliminar.html", {"material": material})

    if request.method == "POST":
        exito = dao.eliminar_material(id_material)

        if exito:
            return redirect("materiales:lista")

        return render(request, "materiales/error.html", {
            "mensaje": "No se pudo eliminar el material."
        })

def confirmacion_registro(request):
    """
    Vista simple que muestra la pagina de confirmacion tras un
    registro exitoso.

    Args:
        request (HttpRequest): objeto de solicitud HTTP de Django.

    Returns:
        HttpResponse: renderiza la pagina de confirmacion estatica.
    """
    return render(request, "materiales/confirmacion.html")