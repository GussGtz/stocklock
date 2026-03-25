import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';

interface TokenCache {
  token: string;
  expiry: Date;
}

interface CdApiConfig {
  apiKey: string;
  baseUrl: string;
}

/**
 * Cliente HTTP para la API REST de ContaDigital.
 * Maneja autenticación con caché de token (50 min) y
 * expone métodos GET/POST/DELETE genéricos.
 */
@Injectable()
export class ContadigitalApiService {
  private readonly logger = new Logger(ContadigitalApiService.name);
  private readonly tokenCache = new Map<string, TokenCache>();

  // ── Auth ────────────────────────────────────────────────────────────

  async getToken(cfg: CdApiConfig): Promise<string> {
    const key = `${cfg.baseUrl}::${cfg.apiKey}`;
    const cached = this.tokenCache.get(key);
    if (cached && cached.expiry > new Date()) return cached.token;

    this.logger.log(`[ContaDigital] Autenticando en ${cfg.baseUrl}`);

    const res = await this.rawFetch(`${cfg.baseUrl}/api/conectar.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ApiKey: cfg.apiKey }),
    });

    // ContaDigital wraps the result: { Resultado: { Token: "..." }, Codigo: 1 }
    const token: string | undefined = res?.Resultado?.Token ?? res?.Token;
    if (!token) {
      throw new ServiceUnavailableException(
        `ContaDigital auth error: ${JSON.stringify(res)}`,
      );
    }

    const expiry = new Date(Date.now() + 50 * 60 * 1_000); // 50 min
    this.tokenCache.set(key, { token, expiry });
    return token;
  }

  invalidateToken(cfg: CdApiConfig): void {
    this.tokenCache.delete(`${cfg.baseUrl}::${cfg.apiKey}`);
  }

  // ── Generic request helpers ─────────────────────────────────────────

  async get<T = any>(path: string, cfg: CdApiConfig): Promise<T> {
    const token = await this.getToken(cfg);
    return this.rawFetch(`${cfg.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
  }

  async post<T = any>(path: string, body: any, cfg: CdApiConfig): Promise<T> {
    const token = await this.getToken(cfg);
    return this.rawFetch(`${cfg.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  }

  async put<T = any>(path: string, body: any, cfg: CdApiConfig): Promise<T> {
    const token = await this.getToken(cfg);
    return this.rawFetch(`${cfg.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  }

  async delete<T = any>(path: string, body: any, cfg: CdApiConfig): Promise<T> {
    const token = await this.getToken(cfg);
    return this.rawFetch(`${cfg.baseUrl}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  }

  // ── Low-level fetch ─────────────────────────────────────────────────

  private async rawFetch(url: string, options: RequestInit): Promise<any> {
    let res: Response;
    try {
      res = await fetch(url, { ...options, signal: AbortSignal.timeout(30_000) });
    } catch (err: any) {
      throw new ServiceUnavailableException(
        `ContaDigital no disponible: ${err.message}`,
      );
    }

    const text = await res.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      throw new ServiceUnavailableException(
        `ContaDigital respuesta inválida (${res.status}): ${text.slice(0, 200)}`,
      );
    }

    if (!res.ok) {
      throw new ServiceUnavailableException(
        `ContaDigital HTTP ${res.status}: ${JSON.stringify(data)}`,
      );
    }

    return data;
  }
}
