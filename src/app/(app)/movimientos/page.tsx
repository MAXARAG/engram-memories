'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MovimientoRow, AnimalRow, TipoMovimiento } from '@/types';
import { getMovimientos, deleteMovimiento, getAnimales } from '@/lib/api';
import { MovimientoModal } from '@/components/movimientos/MovimientoModal';
import { RowActions } from '@/components/common/RowActions';
import { buildAnimalMap, getAnimalDisplayId } from '@/lib/animalReferences';
import {
  ArrowLeftRight,
  Plus,
  Filter,
  X,
  PackageOpen,
} from 'lucide-react';

/* ── tipo badge config ── */
const TIPO_BADGE: Record<TipoMovimiento, { label: string; className: string }> = {
  Alta: { label: 'Alta', className: 'badge badge-success' },
  Baja: { label: 'Baja', className: 'badge badge-danger' },
  Traslado: { label: 'Traslado', className: 'badge badge-warning' },
};

export default function MovimientosPage() {
  const { user } = useAuth();

  /* ── state ── */
  const [movimientos, setMovimientos] = useState<MovimientoRow[]>([]);
  const [animals, setAnimals] = useState<AnimalRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MovimientoRow | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  /* filters */
  const [filterTipo, setFilterTipo] = useState('');
  const [filterAnimal, setFilterAnimal] = useState('');

  /* ── data fetching ── */
  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      const [mData, aData] = await Promise.all([
        getMovimientos(),
        getAnimales(),
      ]);
      setMovimientos(mData);
      setAnimals(aData);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  /* ── derived ── */
  const animalMap = useMemo(() => buildAnimalMap(animals), [animals]);

  const filtered = useMemo(() => {
    let list = movimientos;
    if (filterTipo) list = list.filter((m) => m.tipo === filterTipo);
    if (filterAnimal) {
      const q = filterAnimal.toLowerCase();
      list = list.filter((m) => {
        if (!m.animal_id) return false;
        const display = getAnimalDisplayId(animalMap, m.animal_id);
        return display.toLowerCase().includes(q);
      });
    }
    return list;
  }, [movimientos, filterTipo, filterAnimal, animalMap]);

  const hasActiveFilters = filterTipo || filterAnimal;

  const clearFilters = () => {
    setFilterTipo('');
    setFilterAnimal('');
  };

  /* ── CRUD helpers ── */
  const refresh = async () => {
    const data = await getMovimientos();
    setMovimientos(data);
  };

  const handleDelete = async (id: string) => {
    await deleteMovimiento(id);
    refresh();
  };

  const openEdit = (m: MovimientoRow) => {
    setEditing(m);
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

  /* ── render ── */
  return (
    <div className="module-page">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ArrowLeftRight size={28} style={{ color: 'var(--color-accent)' }} />
          <div>
            <h1 style={{ margin: 0 }}>Movimientos</h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: 14 }}>
              Registro de altas, bajas y traslados
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
            <Plus size={16} /> Nuevo Movimiento
          </button>
        </div>
      </div>

      {/* Filters */}
      {filtersOpen && (
        <div className="record-card" style={{ marginBottom: 16 }}>
          <div className="record-card-body" style={{ gap: 12 }}>
            <div className="record-card-field" style={{ flex: 1, minWidth: 160 }}>
              <span className="record-card-label">Tipo</span>
              <select
                className="input"
                value={filterTipo}
                onChange={(e) => setFilterTipo(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="Alta">Alta</option>
                <option value="Baja">Baja</option>
                <option value="Traslado">Traslado</option>
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
          Historial de Movimientos
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
            {hasActiveFilters ? 'Sin resultados para los filtros aplicados' : 'No hay movimientos registrados'}
          </p>
          {!hasActiveFilters && (
            <button className="btn btn-primary" onClick={openNew} style={{ marginTop: 8 }}>
              <Plus size={16} /> Registrar primer movimiento
            </button>
          )}
        </div>
      ) : (
        <div className="record-grid">
          {filtered.map((m) => {
            const tipoBadge = TIPO_BADGE[m.tipo];
            return (
              <div key={m.id} className="record-card">
                <div className="record-card-header">
                  <div>
                    <strong>
                      {m.animal_id
                        ? getAnimalDisplayId(animalMap, m.animal_id)
                        : 'Sin animal'}
                    </strong>
                    <div className="record-card-meta">
                      {formatDate(m.fecha)}
                      <span className={tipoBadge.className} style={{ marginLeft: 6 }}>
                        {tipoBadge.label}
                      </span>
                    </div>
                  </div>

                  <RowActions
                    onEdit={() => openEdit(m)}
                    onDelete={() => handleDelete(m.id)}
                  />
                </div>

                <div className="record-card-body">
                  {m.motivo && (
                    <div className="record-card-field">
                      <span className="record-card-label">Motivo</span>
                      <span className="record-card-value">{m.motivo}</span>
                    </div>
                  )}

                  {m.destino && (
                    <div className="record-card-field">
                      <span className="record-card-label">Destino</span>
                      <span className="record-card-value">{m.destino}</span>
                    </div>
                  )}

                  {m.observaciones && (
                    <div className="record-card-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="record-card-label">Observaciones</span>
                      <span className="record-card-value" style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
                        {m.observaciones}
                      </span>
                    </div>
                  )}

                  {!m.motivo && !m.destino && !m.observaciones && (
                    <div className="record-card-field" style={{ gridColumn: '1 / -1' }}>
                      <span className="record-card-value" style={{ fontSize: 13, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                        Sin detalles adicionales
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
          Mostrando {filtered.length} de {movimientos.length} registros
        </p>
      )}

      {/* FAB */}
      <button className="fab" onClick={openNew} aria-label="Nuevo movimiento">
        <Plus size={24} />
      </button>

      {/* Modal */}
      {modalOpen && (
        <MovimientoModal
          animals={animals}
          initialData={editing}
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
