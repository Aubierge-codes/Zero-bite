"""
Satellite Ingestion Pipeline
Downloads and processes Sentinel-2 and Landsat-8 imagery.
Extracts NDVI, LST, and soil moisture per 500m grid cell.
"""

from datetime import datetime, timedelta
from loguru import logger
from api.config import get_settings

settings = get_settings()


class SatelliteIngestionPipeline:

    async def run(self, region: str = "Rwanda"):
        """Full satellite ingestion pipeline."""
        from database.session import AsyncSessionLocal
        from database.models import IngestionJob, EnvironmentalFeatures

        job_id = None
        async with AsyncSessionLocal() as db:
            job = IngestionJob(
                job_type="satellite",
                region=region,
                status="running",
                started_at=datetime.utcnow(),
            )
            db.add(job)
            await db.commit()
            job_id = str(job.id)

        try:
            logger.info(f"Starting satellite ingestion for {region}")

            # Step 1: Download latest Sentinel-2 tile
            tile_path = await self._download_sentinel2(region)

            # Step 2: Calculate NDVI
            ndvi_grid = await self._calculate_ndvi(tile_path)

            # Step 3: Download Landsat-8 for LST
            lst_grid = await self._calculate_lst(region)

            # Step 4: SAR soil moisture
            soil_grid = await self._get_soil_moisture_sar(region)

            # Step 5: Store features
            records_saved = await self._store_features(region, ndvi_grid, lst_grid, soil_grid)

            async with AsyncSessionLocal() as db:
                job = await db.get(IngestionJob, job_id)
                job.status = "completed"
                job.records_processed = records_saved
                job.completed_at = datetime.utcnow()
                await db.commit()

            logger.info(f"Satellite ingestion complete: {records_saved} grid cells updated")

        except Exception as e:
            logger.error(f"Satellite ingestion failed: {e}")
            async with AsyncSessionLocal() as db:
                job = await db.get(IngestionJob, job_id)
                job.status = "failed"
                job.error_message = str(e)
                await db.commit()
            raise

    async def _download_sentinel2(self, region: str) -> str:
        """
        Download latest cloud-free Sentinel-2 L2A tile from Copernicus Open Access Hub.
        Returns path to downloaded tile.
        """
        logger.info("Querying Copernicus Hub for latest Sentinel-2 tile...")
        # Production implementation:
        # from sentinelsat import SentinelAPI
        # api = SentinelAPI(settings.COPERNICUS_USERNAME, settings.COPERNICUS_PASSWORD)
        # products = api.query(area_wkt, date=('NOW-7DAYS', 'NOW'), platformname='Sentinel-2',
        #                      cloudcoverpercentage=(0, 30))
        # api.download_all(products)
        if not (settings.COPERNICUS_USERNAME and settings.COPERNICUS_PASSWORD):
            raise RuntimeError("COPERNICUS_USERNAME / COPERNICUS_PASSWORD are not configured — satellite ingestion skipped.")
        raise NotImplementedError("Sentinel-2 download is not implemented yet.")

    async def _calculate_ndvi(self, tile_path: str):
        """
        Calculate NDVI from Sentinel-2 bands B4 (Red) and B8 (NIR).
        NDVI = (B8 - B4) / (B8 + B4)
        """
        import numpy as np
        logger.info("Calculating NDVI from Sentinel-2 bands B4/B8")
        # Production: rasterio.open(b4_path), rasterio.open(b8_path) → compute NDVI raster
        raise NotImplementedError("Sentinel-2 NDVI processing is not configured (needs Copernicus credentials + rasterio).")

    async def _calculate_lst(self, region: str):
        """
        Land Surface Temperature from Landsat-8 Band 10 (thermal infrared).
        Converted from digital numbers to Kelvin then Celsius.
        """
        import numpy as np
        logger.info("Calculating Land Surface Temperature from Landsat-8")
        raise NotImplementedError("Landsat-8 LST processing is not configured.")

    async def _get_soil_moisture_sar(self, region: str):
        """
        Soil moisture estimation from Sentinel-1 SAR backscatter.
        Uses C-band VV polarization change detection.
        """
        import numpy as np
        logger.info("Estimating soil moisture from Sentinel-1 SAR")
        raise NotImplementedError("Sentinel-1 soil-moisture processing is not configured.")

    async def _store_features(self, region, ndvi_grid, lst_grid, soil_grid) -> int:
        """Persist extracted features to database."""
        import numpy as np
        from database.session import AsyncSessionLocal
        from database.models import EnvironmentalFeatures

        async with AsyncSessionLocal() as db:
            count = 0
            for i in range(min(145, ndvi_grid.shape[0])):
                feature = EnvironmentalFeatures(
                    region=region,
                    latitude=-1.98 + i * 0.005,
                    longitude=30.06 + (i % 15) * 0.005,
                    ndvi=float(ndvi_grid.flat[i]),
                    temperature_c=float(lst_grid.flat[i]),
                    soil_moisture=float(soil_grid.flat[i]),
                    data_source="sentinel2+landsat8",
                    recorded_at=datetime.utcnow(),
                )
                db.add(feature)
                count += 1
            await db.commit()
        return count
