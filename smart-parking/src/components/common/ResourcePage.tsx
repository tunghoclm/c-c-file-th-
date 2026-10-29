import { useMemo, useState, type ReactNode } from 'react';
import { Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import type { Database, Entity, EntityKey } from '@/types';
import { useCan, useParkingStore } from '@/stores/useParkingStore';
import { Button } from '@/components/ui/button';
import { DataTable, type Column } from './DataTable';
import { ConfirmDialog, DetailDialog, FilterSelect, PageHeading } from './Elements';
import { FormDialog, type Field } from './FormDialog';
export interface ResourceConfig<K extends EntityKey> {
  key: K;
  title: string;
  description: string;
  singular: string;
  columns: Column<Entity<K>>[];
  fields: Field[];
  defaults: () => Entity<K>;
  parse: (values: Record<string, string>, original: Entity<K>) => Entity<K>;
  filters?: { label: string; options: string[]; value: (row: Entity<K>) => string }[];
  stats?: ReactNode;
  detail?: (row: Entity<K>, db: Database) => ReactNode;
  extraActions?: (row: Entity<K>) => ReactNode;
  embedded?: boolean;
}
export function ResourcePage<K extends EntityKey>({ config }: { config: ResourceConfig<K> }) {
  const { db, save, remove } = useParkingStore();
  const [params] = useSearchParams();
  const route = config.key === 'accounts' ? 'settings' : config.key;
  const create = useCan('create', route),
    edit = useCan('edit', route),
    del = useCan('delete', route);
  const [editing, setEditing] = useState<Entity<K> | null>(null),
    [detail, setDetail] = useState<string | null>(null),
    [deleting, setDeleting] = useState<Entity<K> | null>(null),
    [filters, setFilters] = useState<Record<string, string>>({});
  const values = useMemo(
    () =>
      editing ? Object.fromEntries(Object.entries(editing).map(([k, v]) => [k, String(v)])) : {},
    [editing],
  );
  const rows = db[config.key] as Entity<K>[];
  const selected = rows.find((x) => x.id === detail);
  const filtered = rows.filter(
    (row) =>
      config.filters?.every((f) => !filters[f.label] || f.value(row) === filters[f.label]) ?? true,
  );
  return (
    <>
      {!config.embedded && (
        <PageHeading title={config.title} description={config.description}>
          {create && (
            <Button onClick={() => setEditing(config.defaults())}>
              <Plus size={18} />
              Thêm {config.singular}
            </Button>
          )}
        </PageHeading>
      )}
      {config.stats}
      {config.embedded && (
        <div className="embedded-heading">
          <h2>{config.title}</h2>
          {create && (
            <Button onClick={() => setEditing(config.defaults())}>
              <Plus size={17} />
              Thêm {config.singular}
            </Button>
          )}
        </div>
      )}
      <DataTable
        rows={filtered}
        columns={config.columns}
        title={'Danh sách ' + config.singular}
        exportName={config.key}
        initialQuery={params.get('q') || ''}
        filters={config.filters?.map((f) => (
          <FilterSelect
            key={f.label}
            label={f.label}
            value={filters[f.label] || ''}
            onChange={(v) => setFilters({ ...filters, [f.label]: v })}
            options={f.options}
          />
        ))}
        onRow={(r) => setDetail(r.id)}
        actions={(r) => (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={'Xem ' + r.id}
              title="Xem chi tiết"
              onClick={() => setDetail(r.id)}
            >
              <Eye size={16} />
            </Button>
            {edit && (
              <Button
                variant="ghost"
                size="icon"
                aria-label={'Sửa ' + r.id}
                title="Sửa thông tin"
                onClick={() => setEditing(r)}
              >
                <Pencil size={16} />
              </Button>
            )}
            {config.extraActions?.(r)}
            {del && (
              <Button
                variant="ghost"
                size="icon"
                className="danger-text"
                aria-label={'Xóa ' + r.id}
                title="Xóa"
                onClick={() => setDeleting(r)}
              >
                <Trash2 size={16} />
              </Button>
            )}
          </>
        )}
      />
      <FormDialog
        open={!!editing}
        onClose={() => setEditing(null)}
        title={(editing?.id ? 'Chỉnh sửa ' : 'Thêm ') + config.singular}
        description={
          editing?.id ? 'Mã: ' + editing.id : 'Mã định danh sẽ được tạo tự động khi lưu.'
        }
        fields={config.fields}
        values={values}
        onSave={(v) => {
          if (editing) save(config.key, config.parse(v, editing));
        }}
      />
      <DetailDialog
        open={!!selected}
        onClose={() => setDetail(null)}
        title={'Chi tiết ' + config.singular + ' · ' + (selected?.id || '')}
        items={
          selected
            ? config.columns.map((c) => ({
                label: c.label,
                value: c.render ? c.render(selected) : c.value(selected),
              }))
            : []
        }
      >
        {selected && config.detail?.(selected, db)}
      </DetailDialog>
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title={'Xóa ' + config.singular + '?'}
        description={
          'Bạn đang xóa ' + deleting?.id + '. Dữ liệu có lịch sử liên kết sẽ được bảo vệ.'
        }
        onConfirm={() => {
          try {
            if (deleting) remove(config.key, deleting.id);
            toast.success('Đã xóa bản ghi');
            setDeleting(null);
          } catch (e) {
            toast.error((e as Error).message);
            setDeleting(null);
          }
        }}
      />
    </>
  );
}
