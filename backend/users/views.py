from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth import authenticate, login, logout
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import UserSerializer, LoginSerializer, RegisterSerializer
from django.views.decorators.csrf import csrf_exempt

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Представление для регистрации нового пользователя.
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'user': UserSerializer(user).data
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Представление для входа пользователя.
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        if not user.is_active:
            print('Пользователь неактивен:', user.email)
            return Response({'detail': 'Пользователь неактивен'}, status=status.HTTP_403_FORBIDDEN)
        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'user': UserSerializer(user).data
        })
    print('Ошибка валидации:', serializer.errors)
    return Response(serializer.errors, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    """
    Представление для выхода пользователя.
    """
    logout(request)
    return Response({'detail': 'Successfully logged out.'})

@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """
    Представление для получения и обновления профиля пользователя.
    """
    if request.method == 'GET':
        serializer = UserSerializer(request.user)
        return Response(serializer.data)
    elif request.method == 'PUT':
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def public_profile_view(request, user_id):
    """
    Получение профиля любого пользователя по id (для отображения чужого профиля).
    """
    try:
        user = CustomUser.objects.get(id=user_id)
    except CustomUser.DoesNotExist:
        return Response({'detail': 'Пользователь не найден'}, status=status.HTTP_404_NOT_FOUND)
    serializer = UserSerializer(user)
    return Response(serializer.data)
