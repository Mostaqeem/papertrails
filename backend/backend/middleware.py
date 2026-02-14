from rest_framework_simplejwt.tokens import SlidingToken, TokenError
from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.deprecation import MiddlewareMixin
from datetime import timedelta
from django.utils.timezone import now

EXCLUDED_PATHS = [
    "/api/agreements/dashboard-stats/"    # example: heartbeat
]

class RefreshSlidingTokenMiddleware(MiddlewareMixin):
    def process_response(self, request, response):
        if not hasattr(request, "user") or not request.user.is_authenticated:
            return response

        # Skip excluded GET requests
        if request.path in EXCLUDED_PATHS and request.method == "GET":
            return response

        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            old_token_str = auth_header.split(" ")[1]
            try:
                # Load the existing sliding token
                old_token = SlidingToken(old_token_str)

                # Only refresh if token not expired
                if not old_token.check_exp():
                    # Create a refreshed token using the existing one
                    refreshed_token = old_token
                    refreshed_token.set_exp(lifetime=timedelta(minutes=20))  # slide the expiration forward
                    response['x-refreshed-token'] = str(refreshed_token)
            except TokenError:
                pass

        return response