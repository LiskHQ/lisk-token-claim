import {
	Table,
	Column,
	Model,
	AllowNull,
	Index,
	BeforeUpdate,
	BeforeCreate,
} from 'sequelize-typescript';

@Table
class Signature extends Model {
	@Index({
		name: 'lskAddressSigner',
		unique: true,
	})
	@AllowNull(false)
	@Column
	declare lskAddress: string;

	@Index({
		name: 'lskAddressSigner',
		unique: true,
	})
	@AllowNull(false)
	@Column
	declare signer: string;

	@AllowNull(false)
	@Column
	declare destination: string;

	@AllowNull(false)
	@Column
	declare isOptional: boolean;

	@AllowNull(false)
	@Column
	declare r: string;

	@AllowNull(false)
	@Column
	declare s: string;

	@BeforeUpdate
	@BeforeCreate
	static makeLowerCase(item: Signature) {
		item.r = item.r.toLowerCase();
		item.s = item.s.toLowerCase();
	}
}
export default Signature;
