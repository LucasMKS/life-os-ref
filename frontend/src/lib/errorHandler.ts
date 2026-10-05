export const ErrorHandler = {
  createApiError: (error: any) => {
    return {
      message: error.response?.data?.message || error.message || 'Erro desconhecido',
      status: error.response?.status || 500,
      code: error.response?.data?.code,
      details: error.response?.data,
      timestamp: new Date().toISOString()
    };
  }
};
