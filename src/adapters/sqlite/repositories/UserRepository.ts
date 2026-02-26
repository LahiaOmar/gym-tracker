import type { SQLiteDatabase } from 'expo-sqlite';
import type { User } from '@/src/domain';
import type { UserRepository as IUserRepository, ListOptions } from '@/src/domain';
import { generateId, now } from '../helpers';

type UserRow = {
  id: string;
  display_name: string;
  weight_unit: string;
  created_at: string;
  updated_at: string;
};

function rowToUser(r: UserRow): User {
  return {
    id: r.id,
    displayName: r.display_name,
    weightUnit: r.weight_unit as User['weightUnit'],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function createUserRepository(db: SQLiteDatabase): IUserRepository {
  return {
    async create(entity) {
      const id = entity.id ?? generateId();
      const ts = now();
      await db.runAsync(
        'INSERT INTO user (id, display_name, weight_unit, created_at, updated_at) VALUES (?, ?, ?, ?, ?)',
        id,
        entity.displayName,
        entity.weightUnit,
        ts,
        ts
      );
      return { ...entity, id, createdAt: ts, updatedAt: ts };
    },
    async update(id, patch) {
      const ts = now();
      const updates: string[] = ['updated_at = ?'];
      const params: (string | number)[] = [ts];
      if (patch.displayName !== undefined) {
        updates.push('display_name = ?');
        params.push(patch.displayName);
      }
      if (patch.weightUnit !== undefined) {
        updates.push('weight_unit = ?');
        params.push(patch.weightUnit);
      }
      params.push(id);
      await db.runAsync(`UPDATE user SET ${updates.join(', ')} WHERE id = ?`, params);
      const user = await this.getById(id);
      if (!user) throw new Error('User not found after update');
      return user;
    },
    async delete(id) {
      await db.runAsync('DELETE FROM user WHERE id = ?', id);
    },
    async getById(id) {
      const row = await db.getFirstAsync<UserRow>('SELECT * FROM user WHERE id = ?', id);
      return row ? rowToUser(row) : null;
    },
    async list(options) {
      let sql = 'SELECT * FROM user';
      const params: (string | number)[] = [];
      const limit = options?.limit ?? 100;
      const offset = options?.offset ?? 0;
      const sortField = options?.sort?.field === 'displayName' ? 'display_name' : 'created_at';
      const dir = options?.sort?.direction === 'desc' ? 'DESC' : 'ASC';
      sql += ` ORDER BY ${sortField} ${dir} LIMIT ? OFFSET ?`;
      params.push(limit, offset);
      const rows = await db.getAllAsync<UserRow>(sql, params);
      return rows.map(rowToUser);
    },
  };
}
