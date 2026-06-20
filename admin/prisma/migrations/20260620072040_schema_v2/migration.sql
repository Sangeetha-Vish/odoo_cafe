/*
  Warnings:

  - You are about to drop the column `table_id` on the `orders` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_table_id_fkey";

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "table_id";

-- AlterTable
ALTER TABLE "tables" ADD COLUMN     "floor" TEXT NOT NULL DEFAULT 'Ground Floor';

-- CreateTable
CREATE TABLE "waitlist" (
    "id" SERIAL NOT NULL,
    "customer_name" TEXT NOT NULL,
    "group_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'WAITING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_OrderTables" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_OrderTables_AB_unique" ON "_OrderTables"("A", "B");

-- CreateIndex
CREATE INDEX "_OrderTables_B_index" ON "_OrderTables"("B");

-- AddForeignKey
ALTER TABLE "_OrderTables" ADD CONSTRAINT "_OrderTables_A_fkey" FOREIGN KEY ("A") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_OrderTables" ADD CONSTRAINT "_OrderTables_B_fkey" FOREIGN KEY ("B") REFERENCES "tables"("id") ON DELETE CASCADE ON UPDATE CASCADE;
