from services.image_metadata import ImageMetadataService

result = ImageMetadataService.get_metadata("sample.jpg")

from pprint import pprint
pprint(result)