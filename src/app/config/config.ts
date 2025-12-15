import { environment } from "src/environments/environment";


export const URL_BACKEND = environment.URL_BACKEND;
export const URL_SERVICIOS = environment.URL_SERVICIOS;
export const URL_FRONTED = environment.URL_FRONTED;

export const SIDEBAR:any = [
    {
      'name': 'Roles',
      'permisos': [
        {
          name:'Registrar',
          permiso: 'register_role',
        },
        {
          name:'Editar',
          permiso: 'edit_role',
        },
        {
          name:'Eliminar',
          permiso: 'delete_role',
        }
      ]
    },
    {
      'name': 'Usuarios',
      'permisos': [
        {
          name:'Registrar',
          permiso: 'register_user',
        },
        {
          name:'Editar',
          permiso: 'edit_user',
        },
        {
          name:'Eliminar',
          permiso: 'delete_user',
        }
      ]
    },
    // {
    //   'name': 'Sucursales',
    //   'permisos': [
    //     {
    //       name:'Registrar',
    //       permiso: 'register_sucursales',
    //     },
    //     {
    //       name:'Editar',
    //       permiso: 'edit_sucursales',
    //     },
    //     {
    //       name:'Eliminar',
    //       permiso: 'delete_sucursales',
    //     }
    //   ]
    // },
    {
      'name': 'Tareas',
      'permisos': [
        {
          name:'Registrar',
          permiso: 'register_task',
        },
        {
          name:'Editar',
          permiso: 'edit_task',
        },
        {
          name:'Eliminar',
          permiso: 'delete_task',
        }
      ]
    },
    {
      'name': 'Documentos',
      'permisos': [
        {
          name:'Registrar',
          permiso: 'register_documents',
        },
        {
          name:'Editar',
          permiso: 'edit_documents',
        },
        {
          name:'Eliminar',
          permiso: 'delete_documents',
        }
      ]
    },
    
];

export function isPermission(permission:string){
  let USER_AUTH = JSON.parse(localStorage.getItem("user") ?? '')
  if(USER_AUTH){
    if(USER_AUTH.role_name == 'Super-Admin'){
      return true;
    }
    if(USER_AUTH.permissions.includes(permission)){
      return true;
    }
    return false;
  }
  return false;
}