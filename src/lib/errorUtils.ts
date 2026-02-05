 /**
  * Safe error message mapping for database operations.
  * Prevents exposing internal database structure to users.
  */
 export function getSafeErrorMessage(error: any): string {
   const code = error?.code || error?.status;
   
   const knownErrors: Record<string, string> = {
     // PostgreSQL constraint errors
     '23505': '이미 존재하는 항목입니다.',
     '23503': '관련된 데이터가 존재합니다.',
     '23502': '필수 항목이 누락되었습니다.',
     '23514': '입력값이 유효하지 않습니다.',
     
     // Permission errors
     '42501': '권한이 없습니다.',
     '42000': '권한이 없습니다.',
     
     // PostgREST errors
     'PGRST116': '권한이 없습니다.',
     'PGRST301': '요청한 데이터를 찾을 수 없습니다.',
     'PGRST204': '요청한 데이터를 찾을 수 없습니다.',
     
     // Network errors
     'NETWORK_ERROR': '네트워크 연결을 확인해주세요.',
     'TIMEOUT': '요청 시간이 초과되었습니다.',
   };
   
   return knownErrors[code] || '작업을 완료할 수 없습니다. 잠시 후 다시 시도해주세요.';
 }