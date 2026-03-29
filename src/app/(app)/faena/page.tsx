'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { FaenaRow, AnimalRow } from '@/types';
import { getFaena, deleteFaena, getAnimales } from '@/lib/api';
import { FaenaModal } from '@/components/faena/FaenaModal';
import { RowActions } from '@/components/common/RowActions';
import { buildAnimalMap, getAnimalDisplayId } from '@/lib/animalReferences';
import {
  Scissors,
  Plus,
  Filter,
  X,
  PackageOpen,
} from 'lucide-react';

/* ── helpers ── */
function rendimientoNivel(r: number): 'alto' | 'medio' | 'bajo' {
  if (r >= 55) return 'alto';
  if (r >= 50) return 'medio';
  return 'bajo';
}

const NIVEL_BADGE: Record<string, { label: string; className: string }> = {
  alto: { label: 'Alto', className: 'badge badge-success' },
  medio: { label: 'Medio', className: 'badge badge-warning' },
  bajo: { label: 'Bajo', className: 'badge badge-danger' },
};

export default function FaenaPage() {
  const { user } = useAuth();

  /* ── state ── */
  const [faenas, setFaenas] = useState<FaenaRow[]>([]);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<FaenaRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* filters */
  const [filterEspecie, setFilterEspecie] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');

  /* ── data fetching ── */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [fData, aData] = await Promise.all([
        getFaena(),
        getAnimales(),
      ]);
      setFaenas(fData);
      setAnimals(aData);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* ── derived ── */
  const animalMap = useMemo(() => buildAnimalMap(animals), [animals]);

  const especies = useMemo(
    () => [...new Set(faenas.map((f) => f.especie).filter(Boolean))].sort(),
    [faenas],
  );

  const filtered = useMemo(() => {
    let list = faenas;
    if (filterEspecie) list = list.filter((f) => f.especie === filterEspecie);
    if (filterAnimal) {
      const q = filterAnimal.toLowerCase();
      list = list.filter((f) => {
        if (!f.animal_id) return false;
        const display = getAnimalDisplayId(animalMap, f.animal_id);
        return display.toLowerCase().includes(q);
      });
    }
    return list;
  }, [faenas, filterEspecie, filterAnimal, animalMap]);

  const hasActiveFilters = filterEspecie || filterAnimal;

  const clearFilters = () => {
    setFilterEspecie('');
    setFilterAnimal('');
  };

  /* ── CRUD helpers ── */
  const refresh = async () => {
    const data = await getFaena();
    setFaenas(data);
  };

  const handleDelete = async (id: string) => {
    await deleteFaena(id);
    refresh();
  };

  const openEdit = (f: FaenaRow) => {
    setEditing(f);
    setModalOpen(true);
  };

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  /* ── render helpers ── */
  const formatDate = (d: string) =>
    new Date(d + 'T00:00:00').toLocaleDateString('es-AR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });

  const rendimiento = (pesoVivo: number, pesoCanal: number) =>
    pesoVivo > 0 ? ((pesoCanal / pesoVivo) * 100).toFixed(1) : '—';

  /* ── render ── */
  return (
    <div className="module-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Scissors size={28} style={{ color: 'var(--color-accent)' }} />
          <div>
            <h1 style={{ margin: 0 }}>Faena</h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
              Registro de faenas y rendimientos
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            className="btn btn-outline"
            onClick={() => setFiltersOpen(!filtersOpen)}
            style={{ position: 'relative' }}
          >
            <Filter size={16} />
            <span className="hide-mobile">Filtros</span>
            {hasActiveFilters && <span className="count-badge" />}
          </button>

          <button className="btn btn-primary hide-mobile" onClick={openNew}>
            <Plus size={16} /> Nuevo Registro
          </button>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="record-card" style={{ marginBottom: 16 }}>
          <div className="record-card-body" style={{ gap: 12 }}>
            <div className="record-card-field" style={{ flex: 1, minWidth: 160 }}>
              <span className="record-card-label">Especie</span>
              <select
                className="input"
                value={filterEspecie}
                onChange={(e) => setFilterEspecie(e.target.value)}
              >
                <option value="">Todas</option>
                {especies.map((e) => (
                  <option key={e} value={e}>{e}</option>
                ))}
              </select>
            </div>

            <div className="record-card-field" style={{ flex: 1, minWidth: 160 }}>
              <span className="record-card-label">Animal</span>
              <input
                className="input"
                placeholder="Buscar por ID..."
                value={filterAnimal}
                onChange={(e) => setFilterAnimal(e.target.value)}
              />
            </div>

            {hasActiveFilters && (
              <button
                className="btn btn-outline"
                onClick={clearFilters}
                style={{ alignSelf: 'flex-end' }}
              >
                <X size={14} /> Limpiar
              </button>
            )}
          </div>
        </div>
      )}

      {/* Section header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600 }}>
          Historial de Faenas
          <span className="count-badge" style={{ marginLeft: 8 }}>
            {filtered.length}
          </span>
        </h2>
      </div>

      {/* Content */}
      {loading ? (
        <div className="record-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="skeleton-card">
              <div className="skeleton-bar" style={{ width: '60%' }} />
              <div className="skeleton-bar" style={{ width: '40%' }} />
              <div className="skeleton-bar" style={{ width: '80%' }} />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)' }}>
          <PackageOpen size={48} style={{ marginBottom: 12, opacity: 0.4 }} />
          <p style={{ fontWeight: 600 }}>
            {hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay registros de faena'}
          </p>
          {!hasActiveFilters && (
            <button className="btn btn-primary" onClick={openNew} style={{ marginTop: 8 }}>
              <Plus size={16} /> Registrar primera faena
            </button>
          )}
        </div>
      ) : (
        <div className="record-grid">
          {filtered.map((f) => {
            const rend = f.peso_vivo > 0 ? (f.peso_canal / f.peso_vivo) * 100 : 0;
            const nivel = rendimientoNivel(rend);
            const badge = NIVEL_BADGE[nivel];

            return (
              <div key={f.id} className="record-card">
                <div className="record-card-header">
                  <div>
                    <strong>{getAnimalDisplayId(animalMap, f.animal_id)}</strong>
                    <div className="record-card-meta">
                      {formatDate(f.fecha)}
                      {f.especie && (
                        <span className="badge badge-neutral" style={{ marginLeft: 6 }}>
                          {f.especie}
                        </span>
                      )}
                    </div>
                  </div>

                  <RowActions
                    onEdit={() => openEdit(f)}
                    onDelete={() => handleDelete(f.id)}
                  />
                </div>

                <div className="record-card-body">
                  <div className="record-card-field">
                    <span className="record-card-label">Peso Vivo</span>
                    <span className="record-card-value">{f.peso_vivo} kg</span>
                  </div>

                  <div className="record-card-field">
                    <span className="record-card-label">Peso Canal</span>
                    <span className="record-card-value">{f.peso_canal} kg</span>
                  </div>

                  <div className="record-card-field">
                    <span className="record-card-label">Rendimiento</span>
                    <span className="record-card-value">
                      <span className={badge.className} style={{ marginRight: 4 }}>
                        {badge.label}
                      </span>
                      {rendimiento(f.peso_vivo, f.peso_canal)}%
                    </span>
                  </div>

                  {f.observaciones && (
                    <div className="record-card-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="record-card-label">Observaciones</span>
                      <span className="record-card-value" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {f.observaciones}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer count */}
      {!loading && filtered.length > 0 && (
        <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13, marginTop: 16 }}>
          Mostrando {filtered.length} de {faenas.length} registros
        </p>
      )}

      {/* FAB */}
      <button className="fab" onClick={openNew} aria-label="Nuevo registro de faena">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modalOpen && (
        <FaenaModal
          initialData={editing}
          animals={animals}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSaved={() => {
            setModalOpen(false);
            setEditing(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
