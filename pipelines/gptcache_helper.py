"""Cache semântico via gptcache para evitar chamadas repetidas a APIs de IA."""
import os
from pathlib import Path

try:
    from gptcache import cache
    from gptcache.manager import get_data_manager
    HAS_GPTCACHE = True
except ImportError:
    HAS_GPTCACHE = False


def init_gptcache(db_path: str | Path = None) -> bool:
    """
    Inicializa o GPTCache com suporte persistente em SQLite local.
    Se gptcache não estiver instalado, faz fallback silencioso.
    """
    if not HAS_GPTCACHE:
        print("AVISO: gptcache não instalado. Executando sem cache semântico de IA.")
        return False

    if db_path is None:
        # Padrão: data/cache/gptcache.db
        raiz = Path(__file__).resolve().parents[1]
        db_dir = raiz / "data" / "cache"
        db_dir.mkdir(parents=True, exist_ok=True)
        db_path = db_dir / "gptcache.db"
    else:
        db_path = Path(db_path)
        db_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        # Configuração de persistência em SQLite
        data_manager = get_data_manager(
            data_path=str(db_path),
            max_size=2000,
            clean_size=200
        )
        cache.init(
            pre_embedding_func=lambda data, **kwargs: data,
            data_manager=data_manager
        )
        print(f"GPTCache inicializado com sucesso em {db_path}")
        return True
    except Exception as e:
        print(f"Erro ao inicializar GPTCache: {e}. Executando sem cache.")
        return False
