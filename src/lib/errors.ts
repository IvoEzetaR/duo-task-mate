import { toast } from "@/hooks/use-toast";

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public severity: 'low' | 'medium' | 'high' = 'medium'
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NetworkError extends AppError {
  constructor(message: string = 'Error de conexión') {
    super(message, 'NETWORK_ERROR', 'high');
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Error de autenticación') {
    super(message, 'AUTH_ERROR', 'high');
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Error de validación') {
    super(message, 'VALIDATION_ERROR', 'medium');
  }
}

export class PermissionError extends AppError {
  constructor(message: string = 'No tienes permisos para realizar esta acción') {
    super(message, 'PERMISSION_ERROR', 'high');
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Error en la base de datos') {
    super(message, 'DATABASE_ERROR', 'high');
  }
}

export const errorHandler = {
  handle: (error: unknown, showToast: boolean = true): AppError => {
    let appError: AppError = new AppError('Error desconocido', 'UNKNOWN_ERROR', 'medium');

    if (error instanceof AppError) {
      appError = error;
    } else if (error instanceof Error) {
      // Convertir errores conocidos de Supabase
      if (error.message.includes('Invalid login credentials')) {
        appError = new AuthenticationError('Email o contraseña incorrectos');
      } else if (error.message.includes('Email not confirmed')) {
        appError = new AuthenticationError('Por favor confirma tu email antes de iniciar sesión');
      } else if (error.message.includes('JWT')) {
        appError = new AuthenticationError('Tu sesión ha expirado, por favor inicia sesión nuevamente');
      } else if (error.message.includes('permission denied')) {
        appError = new PermissionError();
      } else if (error.message.includes('duplicate key')) {
        appError = new ValidationError('Ya existe un elemento con estos datos');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        appError = new NetworkError();
      } else {
        appError = new AppError(error.message, 'UNKNOWN_ERROR', 'medium');
      }
    } else {
      appError = new AppError('Error desconocido', 'UNKNOWN_ERROR', 'medium');
    }

    // Log del error para debugging
    console.error('Error handled:', {
      message: appError.message,
      code: appError.code,
      severity: appError.severity,
      originalError: error
    });

    // Mostrar toast si es necesario
    if (showToast) {
      toast({
        title: 'Error',
        description: appError.message,
        variant: "destructive",
      });
    }

    return appError;
  },

  // Para errores críticos que necesitan logging adicional
  logCritical: (error: AppError, context?: Record<string, unknown>): void => {
    console.error('CRITICAL ERROR:', {
      message: error.message,
      code: error.code,
      context,
      timestamp: new Date().toISOString()
    });

    // Aquí se podría integrar con un servicio de logging externo
    // como Sentry, LogRocket, etc.
  }
};

// Wrapper para funciones asíncronas con manejo de errores
export const withErrorHandling = async <T>(
  fn: () => Promise<T>,
  showToast: boolean = true
): Promise<{ data: T | null; error: AppError | null }> => {
  try {
    const data = await fn();
    return { data, error: null };
  } catch (error) {
    const appError = errorHandler.handle(error, showToast);
    return { data: null, error: appError };
  }
};